# Service Hub and Accord Chat Inbox

## Service Hub

`/app` is the service-led AccordPay entry point. It explains the product and
distinguishes the available Secure Escrow Agreements workflow from Jobs &
Services previews and coming-soon modules. `/app/jobs` and `/app/jobs/post` are
non-writing previews: they do not create listings or fabricate marketplace data.
The live wallet-scoped blockchain dashboard remains available at
`/app/overview`.

## Persistent conversations

Accord Chat uses the existing `deal_rooms`, participants, messages, agreement,
delivery, dispute, and escrow-link records. Completion and participant archive
state never delete messages. Archive is participant-specific and removes the
conversation from the default list while preserving it under the Archived
filter.

The inbox summary is wallet-session protected and searches only rooms joined by
that wallet. It supports title, display name, wallet, confirmed UP ID, numeric
escrow ID, and ACP-formatted agreement ID. Support conversations remain in their
separate authorization model.

## Message history

The workspace initially reads the newest 40 messages, reverses them for
oldest-to-newest presentation, and loads earlier sequence pages when the user
scrolls upward. Message UUID deduplication protects pagination and Realtime
insertion. Prepending preserves the visual offset. Initial position prefers the
first unread sequence and otherwise the bottom.

Messages arriving while the user is near the bottom scroll naturally. While the
user reads older history, AccordPay preserves position and shows a New messages
control. The read sequence advances only to an explicitly viewed sequence.
Draft text and scroll position are isolated by room in session storage; draft
text is also stored in participant-scoped PostgreSQL state. Private attachments
and decrypted content are never placed in browser storage.

## Conversation contexts

Migration `202607300003_phase21a_conversation_inbox.sql` adds:

- `context_type` and `context_id`;
- room last-message sequence;
- participant archive, hidden, and draft state;
- inbox, status, title, escrow, participant, and sequence indexes;
- a last-message trigger;
- a unique job-context and participant-pair index.

Future repeated employer/applicant interactions for the same job reuse one room.
Different jobs and direct agreements use different context IDs. Selecting an
applicant can therefore keep the original proposal and negotiation history in
the same room. Support remains a separate context/table family.

Existing RLS continues to use `is_room_participant` for rooms, messages,
attachments, agreements, deliveries, and disputes. The new mutation APIs also
verify the HttpOnly wallet session and room membership server-side. No broad
public read policy is introduced.

## Production steps

1. Apply Phase 20, Phase 20B, then Phase 21A migrations in order.
2. Confirm `deal_room_messages` remains in the Supabase Realtime publication.
3. Verify custom Realtime JWT signing and participant RLS in staging.
4. Test archive, search, pagination, unread positioning, and reconnect using two
   authenticated wallets.
5. Do not enable public job publishing until the Job Marketplace schema,
   moderation, application, proposal, and selection flows are implemented.
