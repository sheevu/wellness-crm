import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
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
import { LEAD_SOURCES, SERVICE_SCOPES } from "@/lib/crm-constants.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .regex(/^[0-9+\s-]+$/, "Enter a valid phone number"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
  source: z.string().min(1, "Select a source"),
  scope: z.string().min(1, "Select a scope"),
  notes: z.string().trim(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return raw.trim();
}

export default function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Doc<"customers">;
}) {
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!customer;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    values: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      source: customer?.source ?? "",
      scope: customer?.scope ?? "",
      notes: customer?.notes ?? "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        phone: normalizeIndianPhone(values.phone),
        email: values.email || undefined,
        source: values.source,
        scope: values.scope,
        notes: values.notes || undefined,
      };
      if (isEditing && customer) {
        await updateCustomer({ customerId: customer._id, ...payload });
        toast.success("Customer updated");
      } else {
        await createCustomer(payload);
        toast.success("Customer added to your funnel");
        form.reset();
      }
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this customer's details."
              : "They'll enter your funnel as a Lead."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input id="name" placeholder="Priya Sharma" {...form.register("name")} />
                <FieldError errors={[form.formState.errors.name]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  placeholder="98765 43210"
                  {...form.register("phone")}
                />
                <FieldError errors={[form.formState.errors.phone]} />
              </FieldContent>
            </Field>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="email">Email (optional)</FieldLabel>
                <Input id="email" placeholder="priya@gmail.com" {...form.register("email")} />
                <FieldError errors={[form.formState.errors.email]} />
              </FieldContent>
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldContent>
                  <FieldLabel>How did they find you?</FieldLabel>
                  <Select
                    value={form.watch("source")}
                    onValueChange={(value) => form.setValue("source", value, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.source]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldContent>
                  <FieldLabel>Area of interest</FieldLabel>
                  <Select
                    value={form.watch("scope")}
                    onValueChange={(value) => form.setValue("scope", value, { shouldValidate: true })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_SCOPES.map((scope) => (
                        <SelectItem key={scope} value={scope}>
                          {scope}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.scope]} />
                </FieldContent>
              </Field>
            </div>
            <Field>
              <FieldContent>
                <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
                <Textarea
                  id="notes"
                  placeholder="Any health goals, preferences, or context worth remembering"
                  {...form.register("notes")}
                />
              </FieldContent>
            </Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Spinner className="size-4" />}
              {isEditing ? "Save Changes" : "Add Customer"}
            </Button>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
