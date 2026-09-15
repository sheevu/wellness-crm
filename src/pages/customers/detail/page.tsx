import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useMutation,
  useQuery,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Phone,
  Mail,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  StickyNote,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { ErrorState, ErrorStateHeader, ErrorStateMedia, ErrorStateTitle, ErrorStateDescription } from "@/components/ui/error-state.tsx";
import { AlertTriangle } from "lucide-react";
import CustomerFormDialog from "../_components/customer-form-dialog.tsx";
import { FUNNEL_STAGE_COLORS, FUNNEL_STAGE_LABELS, formatInr } from "@/lib/crm-constants.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { format } from "date-fns";

const visitSchema = z.object({
  serviceId: z.string().min(1, "Select a service"),
  amount: z.coerce.number().min(0, "Amount can't be negative"),
  visitDate: z.string().min(1, "Select a date"),
  notes: z.string().trim(),
});

type VisitFormValues = z.infer<typeof visitSchema>;
type VisitFormInput = z.input<typeof visitSchema>;

function LogVisitDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: Id<"customers">;
}) {
  const services = useQuery(api.services.list, {});
  const createVisit = useMutation(api.visits.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VisitFormInput, unknown, VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      serviceId: "",
      amount: 0,
      visitDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const activeServices = services?.filter((s) => s.active) ?? [];

  const onSubmit = async (values: VisitFormValues) => {
    setIsSubmitting(true);
    try {
      await createVisit({
        customerId,
        serviceId: values.serviceId as Id<"services">,
        amount: values.amount,
        visitDate: new Date(values.visitDate).toISOString(),
        notes: values.notes || undefined,
      });
      toast.success("Visit logged");
      form.reset({
        serviceId: "",
        amount: 0,
        visitDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as { message: string }).message
          : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a Visit</DialogTitle>
          <DialogDescription>Record a service this customer just took.</DialogDescription>
        </DialogHeader>
        {activeServices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a service first from the Services tab before logging a visit.
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldContent>
                  <FieldLabel>Service</FieldLabel>
                  <Select
                    value={form.watch("serviceId")}
                    onValueChange={(value) => {
                      form.setValue("serviceId", value, { shouldValidate: true });
                      const service = activeServices.find((s) => s._id === value);
                      if (service) {
                        form.setValue("amount", service.price);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeServices.map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name} · {formatInr(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.serviceId]} />
                </FieldContent>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="amount">Amount (₹)</FieldLabel>
                    <Input id="amount" type="number" min={0} {...form.register("amount")} />
                    <FieldError errors={[form.formState.errors.amount]} />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="visitDate">Date</FieldLabel>
                    <Input id="visitDate" type="date" {...form.register("visitDate")} />
                    <FieldError errors={[form.formState.errors.visitDate]} />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="visitNotes">Notes (optional)</FieldLabel>
                  <Textarea id="visitNotes" placeholder="How did the session go?" {...form.register("notes")} />
                </FieldContent>
              </Field>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Spinner className="size-4" />}
                Log Visit
              </Button>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerDetailInner({ customerId }: { customerId: Id<"customers"> }) {
  const navigate = useNavigate();
  const customer = useQuery(api.customers.get, { customerId });
  const visits = useQuery(api.visits.listForCustomer, { customerId });
  const removeCustomer = useMutation(api.customers.remove);
  const removeVisit = useMutation(api.visits.remove);
  const [editOpen, setEditOpen] = useState(false);
  const [logVisitOpen, setLogVisitOpen] = useState(false);

  if (customer === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <ErrorState>
          <ErrorStateHeader>
            <ErrorStateMedia variant="icon">
              <AlertTriangle />
            </ErrorStateMedia>
            <ErrorStateTitle>Customer not found</ErrorStateTitle>
            <ErrorStateDescription>
              This customer may have been removed.
            </ErrorStateDescription>
          </ErrorStateHeader>
        </ErrorState>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/customers")}>
          <ArrowLeft className="size-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await removeCustomer({ customerId });
      toast.success("Customer removed");
      navigate("/customers");
    } catch {
      toast.error("Couldn't remove customer");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <Button variant="ghost" size="sm" className="-ml-2 gap-2" onClick={() => navigate("/customers")}>
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-accent/90 p-6 text-primary-foreground shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{customer.name}</h1>
              <Badge variant="secondary" className="mt-1 border-white/30 bg-white/20 text-primary-foreground">
                {FUNNEL_STAGE_LABELS[customer.funnelStage]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" size="icon" className="text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {customer.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this customer and all their visit history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Phone className="size-4" />
            {customer.phone}
          </span>
          {customer.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="size-4" />
              {customer.email}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/15 p-3">
            <p className="text-xs opacity-80">Visits</p>
            <p className="text-xl font-bold">{customer.visitCount}</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3">
            <p className="text-xs opacity-80">Total Spend</p>
            <p className="text-xl font-bold">{formatInr(customer.totalSpend)}</p>
          </div>
          <div className="rounded-xl bg-white/15 p-3">
            <p className="text-xs opacity-80">Scope</p>
            <p className="truncate text-sm font-semibold">{customer.scope}</p>
          </div>
        </div>
      </div>

      {customer.notes && (
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <StickyNote className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{customer.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Visit History</h2>
        <Button size="sm" className="gap-2" onClick={() => setLogVisitOpen(true)}>
          <Plus className="size-4" />
          Log Visit
        </Button>
      </div>

      {visits === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <Empty className="rounded-2xl border-2 border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No visits logged yet</EmptyTitle>
            <EmptyDescription>Log their first visit to start tracking history.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setLogVisitOpen(true)}>Log Visit</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {visits.map((visit) => (
            <div
              key={visit._id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{visit.serviceName}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(visit.visitDate), "d MMM yyyy")}
                  {visit.notes ? ` · ${visit.notes}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-semibold">{formatInr(visit.amount)}</p>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={async () => {
                  try {
                    await removeVisit({ visitId: visit._id });
                    toast.success("Visit removed");
                  } catch {
                    toast.error("Couldn't remove visit");
                  }
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
      <LogVisitDialog open={logVisitOpen} onOpenChange={setLogVisitOpen} customerId={customerId} />
    </div>
  );
}

export default function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  if (!customerId) {
    navigate("/customers");
    return null;
  }

  return (
    <>
      <Authenticated>
        <CustomerDetailInner customerId={customerId as Id<"customers">} />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to view this customer</h1>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto max-w-3xl space-y-4 p-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AuthLoading>
    </>
  );
}
