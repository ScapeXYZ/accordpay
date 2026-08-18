import { PostJobForm } from "@/components/jobs/post-job-form";
import { Container, PageHeader, Stack } from "@/components/layout";
import { Badge, Button } from "@/components/ui";

export default function PostJobPage() {
  return (
    <Container>
      <Stack gap={6}>
        <PageHeader
          eyebrow="Jobs & Services"
          title="Post a job"
          description="Publish a real opportunity for workers to discover and discuss through Accord Chat."
          primaryAction={<Badge status="funded">Available</Badge>}
          secondaryAction={
            <Button href="/app/jobs" variant="secondary">
              Return to Jobs
            </Button>
          }
        />
        <PostJobForm />
      </Stack>
    </Container>
  );
}
