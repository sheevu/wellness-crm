import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useMutation,
  useQuery,
} from "convex/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { Phone, MoveRight, Users } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  FUNNEL_STAGES,
  FUNNEL_STAGE_LABELS,
  FUNNEL_STAGE_COLORS,
  formatInr,
  type FunnelStage,
} from "@/lib/crm-constants.ts";
import { cn } from "@/lib/utils.ts";

type Customer = Doc<"customers">;

const STAGE_COLUMN_STYLES: Record<FunnelStage, string> = {
  lead: "border-t-chart-4",
  contacted: "border-t-chart-3",
  trial: "border-t-chart-5",
  member: "border-t-primary",
  retained: "border-t-chart-2",
  churned: "border-t-destructive",
};

function CustomerCard({
  customer,
  onMoveStage,
  isOverlay,
}: {
  customer: Customer;
  onMoveStage: (customerId: Id<"customers">, stage: FunnelStage) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: customer._id,
    data: { customer },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow",
        isDragging && !isOverlay && "opacity-30",
        isOverlay && "cursor-grabbing shadow-lg",
        !isOverlay && "cursor-grab hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/customers/${customer._id}`}
          onClick={(e) => e.stopPropagation()}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-sm font-semibold hover:underline">{customer.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="size-3" />
            {customer.phone}
          </p>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoveRight className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FUNNEL_STAGES.map((stage) => (
              <DropdownMenuItem
                key={stage.value}
                disabled={stage.value === customer.funnelStage}
                onClick={() => onMoveStage(customer._id, stage.value)}
              >
                Move to {stage.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{customer.scope}</span>
        <span className="shrink-0 font-medium text-foreground">
          {formatInr(customer.totalSpend)}
        </span>
      </div>
    </div>
  );
}

function FunnelColumn({
  stage,
  customers,
  onMoveStage,
}: {
  stage: FunnelStage;
  customers: Customer[];
  onMoveStage: (customerId: Id<"customers">, stage: FunnelStage) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-2xl border-t-4 bg-muted/40 p-3",
        STAGE_COLUMN_STYLES[stage],
        isOver && "bg-muted/70 ring-2 ring-primary/40",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <Badge className={cn("border", FUNNEL_STAGE_COLORS[stage])} variant="outline">
          {FUNNEL_STAGE_LABELS[stage]}
        </Badge>
        <span className="text-xs font-semibold text-muted-foreground">
          {customers.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-1">
        {customers.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            No customers here
          </div>
        ) : (
          customers.map((customer) => (
            <CustomerCard key={customer._id} customer={customer} onMoveStage={onMoveStage} />
          ))
        )}
      </div>
    </div>
  );
}

function FunnelBoardInner() {
  const customers = useQuery(api.customers.listByStage, {});
  const setFunnelStage = useMutation(api.customers.setFunnelStage);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleMoveStage = async (customerId: Id<"customers">, stage: FunnelStage) => {
    try {
      await setFunnelStage({ customerId, funnelStage: stage });
      toast.success(`Moved to ${FUNNEL_STAGE_LABELS[stage]} — follow-up task created`);
    } catch {
      toast.error("Couldn't move customer");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const customer = event.active.data.current?.customer as Customer | undefined;
    setActiveCustomer(customer ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;
    if (!over) return;
    const customer = active.data.current?.customer as Customer | undefined;
    const newStage = over.id as FunnelStage;
    if (!customer || customer.funnelStage === newStage) return;
    void handleMoveStage(customer._id, newStage);
  };

  if (customers === undefined) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="font-display text-3xl font-bold">Sales Funnel</h1>
        <p className="mb-6 text-muted-foreground">
          Move customers through your journey, from first contact to loyal member.
        </p>
        <Empty className="rounded-2xl border-2 border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No customers yet</EmptyTitle>
            <EmptyDescription>
              Add customers first, then move them through your sales funnel here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/customers">Add Customer</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 md:p-8">
      <div className="mb-4 shrink-0">
        <h1 className="font-display text-3xl font-bold">Sales Funnel</h1>
        <p className="text-muted-foreground">
          Drag a customer, or use the move menu, to advance them through the funnel.
        </p>
      </div>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-2">
          {FUNNEL_STAGES.map((stage) => (
            <FunnelColumn
              key={stage.value}
              stage={stage.value}
              customers={customers.filter((c) => c.funnelStage === stage.value)}
              onMoveStage={handleMoveStage}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCustomer ? (
            <CustomerCard customer={activeCustomer} onMoveStage={handleMoveStage} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default function FunnelPage() {
  return (
    <>
      <Authenticated>
        <FunnelBoardInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to view your funnel</h1>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-8">
          <Skeleton className="h-9 w-64" />
        </div>
      </AuthLoading>
    </>
  );
}
