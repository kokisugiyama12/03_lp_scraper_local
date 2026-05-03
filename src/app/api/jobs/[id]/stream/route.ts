import { jobEvents } from "@/lib/services/event-bus";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const handler = (event: { type: string; data: unknown }) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));

          if (event.type === "job_complete" || event.type === "job_failed") {
            setTimeout(() => controller.close(), 100);
          }
        } catch {
          // stream closed
        }
      };

      jobEvents.on(jobId, handler);

      request.signal.addEventListener("abort", () => {
        jobEvents.off(jobId, handler);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
