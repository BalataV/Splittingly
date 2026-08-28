// iOS implementace Nitro modulu SplittinglyWidget.
//
// `HybridSplittinglyWidgetSpec` je vygenerovaný `nitrogen` z
// `src/SplittinglyWidget.nitro.ts`. Codegen musí proběhnout před buildem.
//
// Zápis jde do App Group UserDefaults sdíleného s widget targetem
// (targets/widget/). App Group „group.com.balata.splittingly" musí být
// v capabilities App ID i widget targetu — jinak `UserDefaults(suiteName:)`
// vrátí nil a zápis tiše propadne.

import Foundation
import WidgetKit
import NitroModules

private let appGroup = "group.com.balata.splittingly"
private let snapshotKey = "widgetSnapshot"

final class HybridSplittinglyWidget: HybridSplittinglyWidgetSpec {

  func setSnapshot(json: String) throws {
    guard let defaults = UserDefaults(suiteName: appGroup) else {
      // App Group není nakonfigurovaná — nemá smysl házet, appka běží dál.
      NSLog("[SplittinglyWidget] App Group \(appGroup) nedostupná, snapshot zahozen.")
      return
    }
    defaults.set(json, forKey: snapshotKey)
  }

  func reload() throws {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
