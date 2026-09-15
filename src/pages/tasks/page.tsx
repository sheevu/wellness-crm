import { Link } from "react-router-dom";
import { Authenticated, Unauthenticated, AuthLoading, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { cn } from "@/lib/utils.ts";

function TasksListInner() {
  const tasks = useQuery(api.tasks.listPending, {});
  const completeTask = useMutation(api.tasks.complete);

  const handleComplete = async (taskId: Id<"tasks">) => {
    try {
      await completeTask({ taskId });
      toast.success("Task completed");
    } catch {
      toast.error("Couldn't complete task");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Follow-ups</h1>
        <p className="text-muted-foreground">
          Automated reminders created as customers move through your funnel.
        </p>
      </div>

      {tasks === undefined ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Empty className="rounded-2xl border-2 border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 />
            </EmptyMedia>
            <EmptyTitle>All caught up!</EmptyTitle>
            <EmptyDescription>
              Move customers through the funnel to generate new follow-up tasks.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/funnel">Go to Funnel</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const overdue = isPast(new Date(task.dueDate));
            return (
              <div
                key={task._id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <Checkbox
                  className="size-5"
                  onCheckedChange={() => void handleComplete(task._id)}
                />
                <div className="min-w-0 flex-1">
                  <Link to={`/customers/${task.customerId}`} className="hover:underline">
                    <p className="text-sm font-semibold">{task.title}</p>
                  </Link>
                  <p
                    className={cn(
                      "flex items-center gap-1 text-xs",
                      overdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {overdue && <AlertCircle className="size-3" />}
                    Due {format(new Date(task.dueDate), "d MMM yyyy")}
                    {overdue ? " · Overdue" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <>
      <Authenticated>
        <TasksListInner />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in to view follow-ups</h1>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="mx-auto max-w-2xl space-y-4 p-8">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AuthLoading>
    </>
  );
}
