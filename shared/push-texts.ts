import type { Lang } from "./types.js";

export type PushKind = "workout" | "weight" | "test";

export interface PushText {
  title: string;
  body: string;
}

export function pushText(lang: Lang, kind: PushKind, detail = ""): PushText {
  switch (kind) {
    case "workout":
      if (lang === "ja") return { title: "今日の運動💪", body: detail || "今日の運動があります" };
      if (lang === "pl") return { title: "Dzisiejszy trening 💪", body: detail || "Dziś masz trening" };
      return { title: "Today's workout 💪", body: detail || "You have a workout today" };
    case "weight":
      if (lang === "ja") return { title: "体重記録", body: "土曜の体重を記録しましょう⚖️" };
      if (lang === "pl") return { title: "Ważenie", body: "Czas na sobotni wpis wagi ⚖️" };
      return { title: "Weight check-in", body: "Time for your Saturday weight entry ⚖️" };
    case "test":
      if (lang === "ja") return { title: "ourcalendar テスト", body: "プッシュ通知は正常です🎉" };
      if (lang === "pl") return { title: "Test ourcalendar", body: "Powiadomienia push działają 🎉" };
      return { title: "ourcalendar test", body: "Push works 🎉" };
  }
}
