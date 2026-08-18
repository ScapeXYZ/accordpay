import { Container, PageHeader, Stack } from "@/components/layout";
import { Badge, Button, Card } from "@/components/ui";

import styles from "./service-hub.module.css";

const services = [
  {
    title: "Jobs & Services",
    status: "Available",
    description:
      "Browse jobs, contact clients, agree on terms, and prepare secure payment through GIWA escrow.",
    actions: [
      { label: "Browse preview", href: "/app/jobs" },
      { label: "Post-job preview", href: "/app/jobs/post" },
    ],
  },
  {
    title: "Secure Escrow Agreements",
    status: "Available",
    description:
      "Create a direct agreement with another user, approve the final terms, fund escrow, submit delivery proof, and release or refund payment.",
    actions: [{ label: "Create agreement", href: "/app?accordChat=new" }],
  },
  {
    title: "Digital Goods",
    status: "Coming soon",
    description: "Protected purchase and delivery workflows for digital goods.",
  },
  {
    title: "NFT Utility Trading",
    status: "Coming soon",
    description: "Agreement-led exchange for utility-bearing digital assets.",
  },
  {
    title: "NFT Pre-Market Deals",
    status: "Coming soon",
    description: "Structured pre-market agreements with explicit escrow terms.",
  },
  {
    title: "Flight Booking",
    status: "Coming soon",
    description: "Escrow-supported travel and flight-payment coordination.",
  },
  {
    title: "Merchant API",
    status: "Coming soon",
    description: "Programmable escrow infrastructure for merchant workflows.",
  },
  {
    title: "Service Marketplace",
    status: "Coming soon",
    description: "Discover providers and move accepted work into Accord Chat.",
  },
] as const;

export default function ServiceHubPage() {
  return (
    <Container size="wide">
      <Stack gap={8}>
        <PageHeader
          eyebrow="AccordPay Service Hub"
          title="Hire, work, agree, and get paid securely."
          description="AccordPay helps clients and service providers agree on terms, communicate, submit work, and protect payment through GIWA escrow."
          showTestnetBadge
          primaryAction={<Button href="/app/jobs">Browse jobs</Button>}
          secondaryAction={
            <Button href="/app/jobs/post" variant="secondary">
              Post a job
            </Button>
          }
        />
        <section aria-labelledby="services-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="services-heading">Services</h2>
              <p>
                Start with secure direct agreements today and preview what
                AccordPay is building next.
              </p>
            </div>
            <Button href="/app/overview" variant="ghost">
              Open Overview
            </Button>
          </div>
          <div className={styles.serviceGrid}>
            {services.map((service) => (
              <Card
                key={service.title}
                variant={
                  service.status === "Available" ? "elevated" : "standard"
                }
                className={styles.serviceCard}
              >
                <div className={styles.cardHeading}>
                  <h3>{service.title}</h3>
                  <Badge
                    status={
                      service.status === "Available" ? "funded" : "created"
                    }
                  >
                    {service.status}
                  </Badge>
                </div>
                <p>{service.description}</p>
                {"actions" in service ? (
                  <div className={styles.cardActions}>
                    {service.actions.map((action, index) => (
                      <Button
                        key={action.href}
                        href={action.href}
                        variant={index === 0 ? "secondary" : "ghost"}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className={styles.unavailable}>
                    This service is not available yet.
                  </p>
                )}
              </Card>
            ))}
          </div>
        </section>
      </Stack>
    </Container>
  );
}
