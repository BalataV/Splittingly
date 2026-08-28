package com.balata.splittinglywidget

// Android implementace Nitro modulu SplittinglyWidget.
//
// `HybridSplittinglyWidgetSpec` je vygenerovaný `nitrogen` z
// `src/SplittinglyWidget.nitro.ts`. Codegen musí proběhnout před buildem.
//
// Zápis jde do SharedPreferences „splittingly_widget", ze kterých čte
// SplittinglyWidgetProvider (viz android-widget/). Po zápisu se pošle
// broadcast, aby se widget překreslil.

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.margelo.nitro.NitroModules
import com.margelo.nitro.splittinglywidget.HybridSplittinglyWidgetSpec

private const val PREFS_NAME = "splittingly_widget"
private const val SNAPSHOT_KEY = "widgetSnapshot"
private const val PROVIDER_CLASS = "com.balata.splittingly.widget.SplittinglyWidgetProvider"

class HybridSplittinglyWidget : HybridSplittinglyWidgetSpec() {

  private val context: Context
    get() = NitroModules.applicationContext
      ?: throw IllegalStateException("SplittinglyWidget: applicationContext není k dispozici")

  override fun setSnapshot(json: String) {
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(SNAPSHOT_KEY, json)
      .apply()
  }

  override fun reload() {
    val ctx = context
    val manager = AppWidgetManager.getInstance(ctx)
    val component = ComponentName(ctx.packageName, PROVIDER_CLASS)
    val ids = runCatching { manager.getAppWidgetIds(component) }.getOrNull() ?: return
    if (ids.isEmpty()) return
    val intent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
      component?.let { setComponent(it) }
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
    }
    ctx.sendBroadcast(intent)
  }
}
