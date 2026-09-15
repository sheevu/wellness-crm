import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaginatedQuery } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useDebounce } from "@/hooks/use-debounce.ts";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { UserPlus, Search, Phone, Users } from "lucide-react";
import CustomerFormDialog from "./_components/customer-form-dialog.tsx";
import { FUNNEL_STAGE_COLORS, FUNNEL_STAGE_LABELS, formatInr } from "@/lib/crm-constants.ts";
import { SignInButton } from "@/components/ui/signin.tsx";

function CustomersListInner() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const { results, status, loadMore } = usePaginatedQuery(
    api.customers.list,
    { searchTerm: debouncedSearch || undefined },
    { initialNumItems: 20 },
  );

  const isLoading = status === "LoadingFirstPage";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage everyone who's part of your wellness journey.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <UserPlus className="size-4" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Empty className="rounded-2xl border-2 border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No customers yet</EmptyTitle>
            <EmptyDescription>
              Add your first customer to start tracking their wellness journey.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setDialogOpen(true)}>Add Customer</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {results.map((customer) => (
            <button
              key={customer._id}
              onClick={() => navigate(`/customers/${customer._id}`)}
              className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-primary-foreground">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{customer.name}</p>
                  <Badge
                    variant="outline"
                    className={FUNNEL_STAGE_COLORS[customer.funnelStage]}
                  >
                    {FUNNEL_STAGE_LABELS[customer.funnelStage]}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {customer.phone}
                  </span>
                  <span>{customer.scope}</span>
                </div>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-semibold">{customer.visitCount} visits</p>
                <p className="text-xs text-muted-foreground">
                  {formatInr(customer.totalSpend)}
                </p>
              </div>
            </button>
          ))}
          {status === "CanLoadMore" && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => loadMore(20)}
            >
              Load more
            </Button>
          )}
        </div>
      )}

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <>
      <Authenticated>
        <CustomersListInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to manage customers</h1>
          <p className="max-w-sm text-muted-foreground">
            Sign in to view and manage your customer relationships.
          </p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto max-w-5xl space-y-3 p-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </AuthLoading>
    </>
  );
}
