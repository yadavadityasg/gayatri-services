package `in`.gayatriservice.technician

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import org.json.JSONObject

class JobWatcherService : Service() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var watching = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(NotificationChannel(DUTY_CHANNEL, "On duty", NotificationManager.IMPORTANCE_MIN))
            manager.createNotificationChannel(NotificationChannel(JOB_CHANNEL, "New jobs", NotificationManager.IMPORTANCE_HIGH))
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val duty = NotificationCompat.Builder(this, DUTY_CHANNEL)
            .setSmallIcon(R.drawable.logo_mark)
            .setContentTitle("GS-Technician")
            .setContentText("Listening for new jobs")
            .setOngoing(true)
            .setContentIntent(openApp())
            .build()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(DUTY_ID, duty, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(DUTY_ID, duty)
        }
        if (!watching) {
            watching = true
            scope.launch { watch() }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        watching = false
        scope.cancel()
        super.onDestroy()
    }

    private suspend fun watch() {
        while (scope.isActive) {
            val store = prefs(this)
            val token = store.getString("token", "").orEmpty()
            val server = store.getString("server", "").orEmpty()
            if (token.isNotBlank() && server.isNotBlank()) {
                try {
                    val result = Api(server).notifications(token)
                    val list = result.optJSONArray("notifications")
                    val ids = mutableListOf<String>()
                    if (list != null) {
                        for (index in 0 until list.length()) {
                            val item = list.getJSONObject(index)
                            showJob(item)
                            ids += item.getString("id")
                        }
                    }
                    if (ids.isNotEmpty()) Api(server).ackNotifications(token, ids)
                } catch (_: Exception) {
                }
            }
            delay(12_000)
        }
    }

    private fun showJob(item: JSONObject) {
        val notification = NotificationCompat.Builder(this, JOB_CHANNEL)
            .setSmallIcon(R.drawable.logo_mark)
            .setContentTitle(item.optString("title", "New job"))
            .setContentText(item.optString("body"))
            .setStyle(NotificationCompat.BigTextStyle().bigText(item.optString("body")))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(openApp())
            .build()
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(item.optString("id").hashCode(), notification)
    }

    private fun openApp(): PendingIntent {
        val intent = Intent(this, MainActivity::class.java)
        return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    companion object {
        private const val DUTY_CHANNEL = "duty"
        private const val JOB_CHANNEL = "jobs"
        private const val DUTY_ID = 41

        fun start(context: Context) {
            ContextCompat.startForegroundService(context, Intent(context, JobWatcherService::class.java))
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, JobWatcherService::class.java))
        }
    }
}
