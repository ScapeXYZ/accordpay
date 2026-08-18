import { JobDetail } from "@/components/jobs/job-detail";
import { Container, Stack } from "@/components/layout";
import { Button } from "@/components/ui";

import styles from "../../app-pages.module.css";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <Container size="wide">
      <Stack gap={5}>
        <Button
          className={styles.backLink}
          href="/app/jobs"
          variant="ghost"
        >
          ← Back to jobs
        </Button>
        <JobDetail jobId={jobId} />
      </Stack>
    </Container>
  );
}
