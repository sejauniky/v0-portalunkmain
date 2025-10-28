"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocation } from "@/hooks/use-location"
import MetricsCard from "@/components/admin-dashboard/MetricsCard"
import SummaryTable from "@/components/admin-dashboard/SummaryTable"
import PaymentReviews from "@/components/admin-dashboard/PaymentReviews"
import { Icon } from "@/components/Icon"
import { useAuth } from "@/hooks/use-auth"
import { analyticsService, eventService, contractService, djService } from "@/services/neonService"
import paymentService from "@/services/neonService"
import { useNeonData } from "@/hooks/useNeonData"

const parseEventDate = (value) => {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
      return null
    }
    const parsed = new Date(year, month - 1, day)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const normalizeToStartOfDay = (date) => {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

const formatEventDate = (value, options) => {
  const date = parseEventDate(value)
  if (!date) return null
  return new Intl.DateTimeFormat("pt-BR", options || { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

const resolveEventDjName = (event) => {
  if (!event) return "DJ não informado"

  const directDj = event.dj
  if (directDj && typeof directDj === "object") {
    const candidate = directDj.name || directDj.artist_name || directDj.email
    if (candidate) return candidate
  }

  if (typeof event.dj_name === "string" && event.dj_name.trim().length > 0) {
    return event.dj_name
  }

  if (Array.isArray(event.event_djs)) {
    for (const relation of event.event_djs) {
      if (!relation || typeof relation !== "object") continue
      const relationDj = relation.dj
      if (relationDj && typeof relationDj === "object") {
        const candidate = relationDj.name || relationDj.artist_name || relationDj.email
        if (candidate) return candidate
      }
      if (typeof relation.dj_name === "string" && relation.dj_name.trim().length > 0) {
        return relation.dj_name
      }
    }
  }

  if (typeof event.dj_id === "string" && event.dj_id.trim().length > 0) {
    return `DJ ${event.dj_id}`
  }

  return "DJ não informado"
}

const Home = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const { user } = useAuth()
  const [, setLocation] = useLocation()

  const { data: metrics, loading: metricsLoading } = useNeonData(analyticsService, "getDashboardMetrics", [], [])

  const { data: contracts } = useNeonData(contractService, "getAll", [], [])

  const { data: events } = useNeonData(eventService, "getAll", [], [])

  const { data: payments } = useNeonData(paymentService, "getAll", [], [])

  const { data: djs } = useNeonData(djService, "getAll", [], [])

  useEffect(() => {
    // Set initial time and hydration flag on client
    setCurrentTime(new Date())
    setIsHydrated(true)

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const eventStatusSummary = useMemo(() => {
    const eventsList = events || []
    const total = eventsList.length
    const counts = eventsList.reduce(
      (acc, event) => {
        const status = String(event?.status || "").toLowerCase()
        if (status === "confirmed") {
          acc.confirmed += 1
        } else if (status === "pending") {
          acc.pending += 1
        } else if (status === "completed" || status === "concluded") {
          acc.completed += 1
        }
        return acc
      },
      { confirmed: 0, pending: 0, completed: 0 },
    )

    const toPercentage = (value) => (total > 0 ? Math.round((value / total) * 100) : 0)

    return {
      total,
      confirmed: counts.confirmed,
      pending: counts.pending,
      completed: counts.completed,
      percentages: {
        confirmed: toPercentage(counts.confirmed),
        pending: toPercentage(counts.pending),
        completed: toPercentage(counts.completed),
      },
    }
  }, [events])

  const upcomingEventsWithin15Days = useMemo(() => {
    if (!events || events.length === 0) return []

    const startOfToday = normalizeToStartOfDay(new Date())
    const limit = new Date(startOfToday)
    limit.setDate(limit.getDate() + 15)
    limit.setHours(23, 59, 59, 999)

    return [...events]
      .filter((event) => {
        const eventDate = parseEventDate(event?.event_date)
        if (!eventDate) return false
        const normalizedEventDate = normalizeToStartOfDay(eventDate)
        return normalizedEventDate >= startOfToday && normalizedEventDate <= limit
      })
      .sort((a, b) => {
        const firstDate = parseEventDate(a?.event_date)?.getTime() ?? 0
        const secondDate = parseEventDate(b?.event_date)?.getTime() ?? 0
        return firstDate - secondDate
      })
  }, [events])

  const upcomingEventsSummary = useMemo(
    () =>
      upcomingEventsWithin15Days.slice(0, 4).map((event) => ({
        id: event?.id,
        dj: resolveEventDjName(event),
        date: event?.event_date,
        formattedDate: formatEventDate(event?.event_date, { day: "2-digit", month: "short" }),
        location: event?.location || event?.venue || "Local não informado",
      })),
    [upcomingEventsWithin15Days],
  )

  const metricsData = [
    {
      title: "Total de DJs",
      value: metrics?.totalDJs?.toString() || "0",
      change: metrics?.djsChange || "Sem dados",
      changeType: metrics?.djsChangeType || "neutral",
      icon: "Users",
      color: "primary",
      clickable: false,
    },
    {
      title: "Agenda do Admin",
      value: isHydrated && currentTime ? currentTime.toLocaleDateString("pt-BR") : "--",
      change: "Clique para acessar",
      changeType: "neutral",
      icon: "Calendar",
      color: "primary",
      clickable: true,
      onClick: () => setLocation("/agenda-manager"),
      valueStyle: { fontSize: 17, fontWeight: 500, lineHeight: "32px" },
    },
  ]

  const contractsData =
    contracts?.slice(0, 5)?.map((contract) => ({
      id: contract?.id,
      dj: contract?.event?.dj?.name || "N/A",
      evento: contract?.event?.title || "N/A",
      produtor: contract?.event?.producer?.name || contract?.event?.producer?.company_name || "N/A",
      valor: Number.parseFloat(contract?.event?.cache_value || 0),
      status: contract?.signed ? "assinado" : contract?.signature_status || "pendente",
      data: contract?.event?.event_date || contract?.created_at,
    })) || []

  const contractColumns = [
    { key: "dj", label: "DJ", sortable: true, type: "avatar" },
    { key: "evento", label: "Evento", sortable: true },
    { key: "produtor", label: "Produtor", sortable: true },
    { key: "valor", label: "Valor", sortable: true, type: "currency" },
    { key: "status", label: "Status", type: "status" },
    { key: "data", label: "Data", sortable: true, type: "date" },
  ]

  const eventsData = useMemo(
    () =>
      upcomingEventsWithin15Days.slice(0, 5).map((event) => ({
        id: event?.id,
        nome: event?.title || event?.event_name || "Evento",
        data: event?.event_date,
        formattedDate: formatEventDate(event?.event_date),
        local: event?.location || event?.venue || "Local não informado",
        djs: Array.isArray(event?.djs)
          ? event.djs.length
          : Array.isArray(event?.event_djs)
            ? event.event_djs.length
            : event?.dj
              ? 1
              : 0,
        status: event?.status,
        dj: resolveEventDjName(event),
      })),
    [upcomingEventsWithin15Days],
  )

  const eventColumns = [
    { key: "nome", label: "Evento", sortable: true },
    { key: "data", label: "Data", sortable: true, type: "date" },
    { key: "local", label: "Local", sortable: true },
    { key: "djs", label: "DJs", sortable: true },
    { key: "status", label: "Status", type: "status" },
  ]

  const paymentsData =
    payments?.slice(0, 5)?.map((payment) => ({
      id: payment?.id,
      produtor: payment?.event?.producer?.name || payment?.event?.producer?.company_name || "N/A",
      evento: payment?.event?.title || "N/A",
      valor: Number.parseFloat(payment?.amount || 0),
      data: payment?.paid_at || payment?.created_at,
      status: payment?.status === "paid" ? "concluido" : payment?.status,
    })) || []

  const paymentColumns = [
    { key: "produtor", label: "Produtor", sortable: true, type: "avatar" },
    { key: "evento", label: "Evento", sortable: true },
    { key: "valor", label: "Valor", sortable: true, type: "currency" },
    { key: "data", label: "Data", sortable: true, type: "date" },
    { key: "status", label: "Status", type: "status" },
  ]

  const revenueChartData = useMemo(() => {
    const monthlyRevenue = {}
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toLocaleDateString("pt-BR", { month: "short" })
      monthlyRevenue[monthKey] = 0
    }
    ;(payments || []).forEach((payment) => {
      if (payment?.status === "paid" && payment?.paid_at) {
        const paymentDate = new Date(payment.paid_at)
        const monthKey = paymentDate.toLocaleDateString("pt-BR", { month: "short" })
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += Number.parseFloat(payment.amount || 0)
        }
      }
    })

    return Object.entries(monthlyRevenue).map(([name, value]) => ({ name, value }))
  }, [payments])

  const djDistributionData = useMemo(() => {
    const genreCount = {}
    ;(djs || []).forEach((dj) => {
      const genres = dj?.specialties || [dj?.genre] || ["Outros"]
      genres.forEach((genre) => {
        if (genre) {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        }
      })
    })

    return Object.entries(genreCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [djs])

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Administrativo</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das operações -{" "}
              {isHydrated && currentTime ? currentTime.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }) : "--"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Icon
                name="Clock"
                size={16}
                style={{ color: "rgba(209, 166, 39, 1)", textShadow: "1px 1px 3px rgba(221, 118, 28, 1)" }}
              />
              <span style={{ color: "rgba(250, 161, 72, 1)" }}>
                {isHydrated && currentTime ? currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </span>
            </div>
            {user && (
              <div
                className="glass-surface mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs sm:text-sm text-blue-300 whitespace-nowrap"
                style={{ color: "rgba(253, 178, 96, 0.8)" }}
              >
                {user?.email}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 pl-8">
        {metricsLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="glass-card h-32 animate-pulse">
                <div className="h-4 bg-blue-500/20 rounded mb-2"></div>
                <div className="h-8 bg-blue-500/20 rounded mb-2"></div>
                <div className="h-3 bg-blue-500/20 rounded w-2/3"></div>
              </div>
            ))
          : metricsData?.map((metric, index) => (
              <MetricsCard
                key={index}
                title={metric?.title}
                value={metric?.value}
                change={metric?.change}
                changeType={metric?.changeType}
                icon={metric?.icon}
                color={metric?.color}
                clickable={metric?.clickable}
                onClick={metric?.onClick}
                valueStyle={metric?.valueStyle}
              />
            ))}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status dos Eventos</p>
              <p className="text-2xl font-bold text-foreground">{eventStatusSummary.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-muted/20" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Confirmados</p>
              <p className="text-lg font-semibold text-success" style={{ color: "rgba(14, 229, 143, 1)" }}>
                {eventStatusSummary.confirmed}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
              <p className="text-lg font-semibold text-warning" style={{ color: "rgba(221, 245, 11, 1)" }}>
                {eventStatusSummary.pending}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Concluídos</p>
              <p className="text-lg font-semibold text-secondary" style={{ color: "rgba(14, 100, 187, 1)" }}>
                {eventStatusSummary.completed}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success/70" style={{ width: `${eventStatusSummary.percentages.confirmed}%` }} />
          </div>
        </div>
      </div>

      <section className="mb-8 pl-8">
        <h2 className="text-lg font-semibold mb-3">Revisão de Comprovantes</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <PaymentReviews />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Próximos eventos</h3>
              <p className="text-sm text-muted-foreground">
                {upcomingEventsSummary.length} {upcomingEventsSummary.length === 1 ? "evento" : "eventos"} nos próximos
                15 dias
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/20">
              <Icon name="MapPin" size={20} className="text-primary" style={{ color: "rgba(24, 76, 229, 1)" }} />
            </div>
          </div>
          <div className="space-y-4">
            {upcomingEventsSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento agendado nos próximos 15 dias.</p>
            ) : (
              upcomingEventsSummary.map((event, index) => (
                <div
                  key={event.id || `${event.date}-${index}`}
                  className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{event.dj}</p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {event.formattedDate || formatEventDate(event.date, { day: "2-digit", month: "short" }) || "--"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="DollarSign" size={18} className="text-success" />
            <h3 className="text-lg font-semibold text-foreground">Resumo Financeiro</h3>
          </div>
          {(() => {
            const paid = (payments || []).filter((p) => String(p?.status).toLowerCase() === "paid")
            const pendingAll = (payments || []).filter((p) => String(p?.status).toLowerCase() !== "paid")
            const sum = (arr) => arr.reduce((s, p) => s + (Number.parseFloat(p?.amount) || 0), 0)
            const recebido = sum(paid)
            const pendente = sum(pendingAll)
            const comissao = recebido * 0.2
            const formatCurrency = (amount) =>
              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount || 0)
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(recebido)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold text-warning">{formatCurrency(pendente)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão (20%)</p>
                  <p className="text-xl font-bold text-purple-400">{formatCurrency(comissao)}</p>
                </div>
              </div>
            )
          })()}
          <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
            {(() => {
              const total = (payments || []).reduce((s, p) => s + (Number.parseFloat(p?.amount) || 0), 0)
              const paid = (payments || [])
                .filter((p) => String(p?.status).toLowerCase() === "paid")
                .reduce((s, p) => s + (Number.parseFloat(p?.amount) || 0), 0)
              const pctPaid = total > 0 ? Math.round((paid / total) * 100) : 0
              return <div className="h-full bg-success/70" style={{ width: pctPaid + "%" }} />
            })()}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SummaryTable title="Próximos Eventos" data={eventsData} columns={eventColumns} type="events" />
      </div>
    </div>
  )
}

export default Home
