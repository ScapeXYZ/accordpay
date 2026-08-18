import { safeMessageParts } from "@/services/deal-room/rich-message";

export function RichMessage({ body }: { body: string }) {
  return (
    <p>
      {safeMessageParts(body).map((part, index) =>
        part.link ? (
          <a
            href={part.text}
            target="_blank"
            rel="noopener noreferrer nofollow"
            key={`${part.text}-${index}`}
          >
            {part.text}
          </a>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </p>
  );
}
