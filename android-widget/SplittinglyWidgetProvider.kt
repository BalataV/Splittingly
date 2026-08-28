package com.balata.splittingly.widget

// STUB — App Widget „you owe / you're owed".
// Čte předformátovaný snapshot ze SharedPreferences, který zapsala appka
// (viz src/widget/contract.ts). Nikdy nesahá na síť. Překreslení spouští
// appka broadcastem ACTION_APPWIDGET_UPDATE po zápisu.
//
// Formát částek NEDĚLÁ tady — dostává hotové řetězce z JS (money.ts je
// jediné místo, kde se počítá s penězi). Viz PLAN-pro-batch-2.md §1.4.

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject

private const val PREFS_NAME = "splittingly_widget"
private const val SNAPSHOT_KEY = "widgetSnapshot"
private const val DEEP_LINK = "splittingly://overview"

class SplittinglyWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val snapshot = readSnapshot(context)
        for (id in appWidgetIds) {
            val views = RemoteViews(context.packageName, resId(context, "layout", "splittingly_widget"))

            when (snapshot?.optString("state")) {
                "ok" -> {
                    views.setTextViewText(txt(context, "widget_owed"), line(snapshot, "owed"))
                    views.setTextViewText(txt(context, "widget_owe"), line(snapshot, "owe"))
                }
                "empty" -> {
                    views.setTextViewText(txt(context, "widget_owed"), "No groups yet")
                    views.setTextViewText(txt(context, "widget_owe"), "")
                }
                else -> {
                    views.setTextViewText(txt(context, "widget_owed"), "Open Splittingly")
                    views.setTextViewText(txt(context, "widget_owe"), "")
                }
            }

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(DEEP_LINK)).apply {
                setPackage(context.packageName)
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val pending = PendingIntent.getActivity(context, 0, intent, flags)
            views.setOnClickPendingIntent(resId(context, "id", "widget_root"), pending)

            appWidgetManager.updateAppWidget(id, views)
        }
    }

    private fun readSnapshot(context: Context): JSONObject? {
        val raw = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(SNAPSHOT_KEY, null) ?: return null
        return runCatching { JSONObject(raw) }.getOrNull()
    }

    private fun line(snapshot: JSONObject, side: String): String =
        snapshot.optJSONObject(side)?.optString("display").orEmpty()

    private fun resId(context: Context, type: String, name: String): Int =
        context.resources.getIdentifier(name, type, context.packageName)

    private fun txt(context: Context, name: String): Int = resId(context, "id", name)
}
