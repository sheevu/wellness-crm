import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Sparkles, Plus, Trash2, Clock } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { SERVICE_SCOPES, formatInr } from "@/lib/crm-constants.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

const serviceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required"),
  category: z.string().min(1, "Select a category"),
  price: z.coerce.number().min(0, "Price can't be negative"),
  durationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;
type ServiceFormInput = z.input<typeof serviceSchema>;

function ServiceFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createService = useMutation(api.services.create);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", category: "", price: 0, durationMinutes: 60 },
  });

  const onSubmit = async (values: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      await createService(values);
      toast.success("Service added");
      form.reset({ name: "", category: "", price: 0, durationMinutes: 60 });
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
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Add a service that customers can book, like Yoga sessions or Diet Consultations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="serviceName">Service Name</FieldLabel>
                <Input
                  id="serviceName"
                  placeholder="Personalized Diet Plan"
                  {...form.register("name")}
                />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldContent>
                <FieldLabel>Category</FieldLabel>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value) => form.setValue("category", value, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_SCOPES.map((scope) => (
                      <SelectItem key={scope} value={scope}>
                        {scope}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.category]} />
              </FieldContent>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="price">Price (₹)</FieldLabel>
                  <Input id="price" type="number" min={0} {...form.register("price")} />
                  <FieldError errors={[form.formState.errors.price]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldContent>
                  <FieldLabel htmlFor="duration">Duration (mins)</FieldLabel>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    {...form.register("durationMinutes")}
                  />
                  <FieldError errors={[form.formState.errors.durationMinutes]} />
                </FieldContent>
              </Field>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Spinner className="size-4" />}
              Add Service
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceCard({ service }: { service: Doc<"services"> }) {
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);

  const toggleActive = async (active: boolean) => {
    try {
      await updateService({
        serviceId: service._id,
        name: service.name,
        category: service.category,
        price: service.price,
        durationMinutes: service.durationMinutes,
        active,
      });
    } catch {
      toast.error("Couldn't update service");
    }
  };

  const handleDelete = async () => {
    try {
      await removeService({ serviceId: service._id });
      toast.success("Service removed");
    } catch {
      toast.error("Couldn't remove service");
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2 to-primary text-primary-foreground">
        <Sparkles className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{service.name}</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{service.category}</Badge>
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {service.durationMinutes} min
          </span>
          <span className="font-medium text-foreground">{formatInr(service.price)}</span>
        </div>
      </div>
      <Switch checked={service.active} onCheckedChange={toggleActive} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {service.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This won't affect past visit records, but you won't be able to log new visits
              for this service.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ServicesInner() {
  const services = useQuery(api.services.list, {});
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Services</h1>
          <p className="text-sm text-muted-foreground">
            The treatments and sessions you offer, with pricing in rupees.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Service
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {services === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <Empty className="rounded-2xl border-2 border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles />
            </EmptyMedia>
            <EmptyTitle>No services yet</EmptyTitle>
            <EmptyDescription>
              Add the treatments and sessions you offer so you can log visits.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setDialogOpen(true)}>Add Service</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard key={service._id} service={service} />
          ))}
        </div>
      )}

      <ServiceFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <Authenticated>
        <ServicesInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to manage services</h1>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto max-w-4xl space-y-3 p-8">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </AuthLoading>
    </>
  );
}
