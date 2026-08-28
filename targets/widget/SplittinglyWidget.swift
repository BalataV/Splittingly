// STUB — WidgetKit widget „you owe / you're owed".
//
// Čte předformátovaný snapshot z App Group UserDefaults, který zapsala
// appka (viz src/widget/contract.ts). Nikdy nesahá na síť. Refresh policy
// `.never` — překreslení spouští appka přes WidgetCenter.reloadAllTimelines().
//
// Formát částek se tu NEDĚLÁ — widget dostává hotové `display` řetězce z JS
// (money.ts je jediné místo, kde se počítá s penězi). Viz PLAN-pro-batch-2.md §1.4.

import WidgetKit
import SwiftUI

private let appGroup = "group.com.balata.splittingly"
private let snapshotKey = "widgetSnapshot"

// MARK: - Model

struct WidgetSnapshot: Decodable {
    struct Side: Decodable { let display: String }
    struct Net: Decodable { let display: String; let headlineMinor: Int }
    let state: String
    let owe: Side
    let owed: Side
    let net: Net
    let groupCount: Int
}

func readSnapshot() -> WidgetSnapshot? {
    guard
        let defaults = UserDefaults(suiteName: appGroup),
        let raw = defaults.string(forKey: snapshotKey),
        let data = raw.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
}

// MARK: - Timeline

struct Entry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), snapshot: nil) }

    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
        completion(Entry(date: Date(), snapshot: readSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        // `.never` — příští překreslení si vyžádá appka, ne OS.
        completion(Timeline(entries: [Entry(date: Date(), snapshot: readSnapshot())], policy: .never))
    }
}

// MARK: - View

struct SplittinglyWidgetView: View {
    var entry: Entry

    // Barvy „Hard Split" — drženo shodně s src/theme.ts.
    private let ink = Color(red: 0.063, green: 0.063, blue: 0.063)
    private let bone = Color(red: 0.98, green: 0.969, blue: 0.941)
    private let muted = Color(red: 0.353, green: 0.353, blue: 0.353)
    private let negative = Color(red: 1.0, green: 0.176, blue: 0.086)
    private let positive = Color(red: 0.0, green: 0.639, blue: 0.290)

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            switch entry.snapshot?.state {
            case "ok":
                Text("YOU ARE OWED").font(.system(size: 10, weight: .bold)).foregroundColor(muted)
                Text(entry.snapshot?.owed.display ?? "")
                    .font(.system(size: 22, weight: .heavy)).foregroundColor(ink)
                Text(entry.snapshot?.owe.display ?? "")
                    .font(.system(size: 14, weight: .bold)).foregroundColor(negative)
            case "empty":
                Text("No groups yet").font(.system(size: 15, weight: .bold)).foregroundColor(ink)
            default:
                Text("Open Splittingly").font(.system(size: 15, weight: .bold)).foregroundColor(ink)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding(12)
        .background(bone)
        .widgetURL(URL(string: "splittingly://overview"))
    }
}

// MARK: - Widget

struct SplittinglyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SplittinglyWidget", provider: Provider()) { entry in
            SplittinglyWidgetView(entry: entry)
        }
        .configurationDisplayName("Splittingly")
        .description("Who owes whom, at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
