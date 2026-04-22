import { MoreHorizontal } from "lucide-react";

type Message = {
  name: string;
  initials: string;
  date: string;
  text: string;
  replies?: number;
  reactions?: { emoji: string; count: number }[];
  color: string;
};

const messages: Message[] = [
  {
    name: "Michael Gough",
    initials: "MG",
    date: "Mon Apr 13 2026",
    text: "Hello @designteam Let's schedule a kick-off meeting and workshop this week. It would be great to gather everyone involved in the design project. Let me know about your availability in the thread.\n\nLooking forward to it! Thanks.",
    replies: 4,
    color: "from-chart-3 to-primary",
  },
  {
    name: "Bonnie Green",
    initials: "BG",
    date: "Mon Apr 13 2026",
    text: "Hello everyone,\n\nThank you for the workshop, it was very productive meeting. I can't wait to start working on this new project with you guys. But first things first, I'm waiting for the offer and pitch deck from you. It would be great to get it by the end of the month.\n\nCheers!",
    reactions: [
      { emoji: "👍", count: 14 },
      { emoji: "🎉", count: 8 },
      { emoji: "📌", count: 3 },
    ],
    color: "from-primary to-chart-2",
  },
  {
    name: "Jese Leos",
    initials: "JL",
    date: "Mon Apr 13 2026",
    text: "Ok @team I'm attaching our offer and pitch deck. Take your time to review everything. I am looking forward to the next steps! Thank you.",
    color: "from-chart-2 to-chart-3",
  },
];

const SmartChat = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-card-foreground">Smart chat</h3>
        <button className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline">
          View all
        </button>
      </div>

      <div className="mt-4 space-y-5">
        {messages.map((m) => (
          <div key={m.name} className="flex gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-primary-foreground ${m.color}`}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm">
                  <span className="font-semibold text-card-foreground">{m.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.date}</span>
                </p>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{m.text}</p>

              {m.replies && (
                <button className="mt-2 text-xs font-semibold text-primary hover:underline">
                  {m.replies} replies
                </button>
              )}

              {m.reactions && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.reactions.map((r) => (
                    <span
                      key={r.emoji}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-card-foreground"
                    >
                      <span>{r.emoji}</span>
                      <span className="font-medium">{r.count}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartChat;