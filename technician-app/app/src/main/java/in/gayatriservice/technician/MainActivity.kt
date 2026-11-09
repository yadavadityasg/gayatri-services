package `in`.gayatriservice.technician

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = LightColors) {
                GayatriApp()
            }
        }
    }
}

internal fun prefs(context: Context) =
    context.getSharedPreferences("gayatri_tech", Context.MODE_PRIVATE)

private fun absoluteUrl(server: String, path: String): String {
    if (path.startsWith("http://") || path.startsWith("https://")) return path
    return server.trim().trimEnd('/') + "/" + path.trimStart('/')
}

private fun statusLabel(status: String) = when (status) {
    "accepted" -> "Accepted"
    "on_the_way" -> "On the way"
    "completed" -> "Completed"
    "cancelled" -> "Cancelled"
    else -> "Assigned"
}

private fun jobTab(status: String) = when (status) {
    "accepted", "on_the_way" -> 1
    "completed", "cancelled" -> 2
    else -> 0
}

private fun jobClosed(status: String) = status == "completed" || status == "cancelled"

private enum class JobTone { Normal, Soon, Hour, Overdue, Urgent }

private fun inferredClock(note: String) = when {
    note.contains("morning", ignoreCase = true) -> "08:00"
    note.contains("afternoon", ignoreCase = true) -> "12:00"
    note.contains("evening", ignoreCase = true) -> "16:00"
    else -> ""
}

private fun minutesUntilVisit(job: JSONObject): Long? {
    val date = job.optString("visit_date")
    if (date.length < 10) return null
    val clock = job.optString("visit_time").ifBlank { inferredClock(job.optString("time_slot")) }
    val parts = clock.split(":")
    if (parts.size < 2) return null
    val hour = parts[0].toIntOrNull() ?: return null
    val minute = parts[1].toIntOrNull() ?: return null
    val visit = LocalDate.parse(date.take(10)).atTime(hour, minute).atZone(ZoneId.systemDefault()).toInstant()
    return Duration.between(Instant.now(), visit).toMinutes()
}

private fun jobTone(job: JSONObject): JobTone {
    if (jobClosed(job.optString("status"))) return JobTone.Normal
    val minutes = minutesUntilVisit(job)
    val timed = when {
        minutes == null -> JobTone.Normal
        minutes < -15 -> JobTone.Overdue
        minutes <= 60 -> JobTone.Hour
        else -> {
            val today = job.optString("visit_date").take(10) == LocalDate.now().toString()
            if (today || minutes <= 360) JobTone.Soon else JobTone.Normal
        }
    }
    return if (job.optString("priority") == "urgent") JobTone.Urgent else timed
}

private fun toneLabel(tone: JobTone) = when (tone) {
    JobTone.Urgent -> "Urgent"
    JobTone.Hour -> "1 hour left"
    JobTone.Soon -> "Coming up"
    JobTone.Overdue -> "Overdue"
    JobTone.Normal -> ""
}

private fun toneColors(tone: JobTone) = when (tone) {
    JobTone.Urgent -> Color(0xFFFFEBEE) to Color(0xFFC62828)
    JobTone.Hour -> Color(0xFFFFF8E1) to Color(0xFFF9A825)
    JobTone.Soon -> Color(0xFFFFF3E0) to Color(0xFFEF6C00)
    JobTone.Overdue -> Color(0xFFFFE0B2) to Color(0xFFE65100)
    JobTone.Normal -> Color.White to Color.Transparent
}

private fun whenLabel(job: JSONObject): String {
    val clock = job.optString("visit_time")
    val pretty = if (clock.length >= 4) {
        val hour = clock.substringBefore(":").toIntOrNull()
        val minute = clock.substringAfter(":").take(2)
        val shown = if (hour == null) null else if (hour % 12 == 0) 12 else hour % 12
        if (hour == null || shown == null) clock else "$shown:$minute ${if (hour >= 12) "PM" else "AM"}"
    } else ""
    return listOf(job.optString("visit_date"), pretty, job.optString("time_slot")).filter { it.isNotBlank() }.joinToString(" · ")
}

private val LightColors = lightColorScheme(
    primary = Color(0xFF8A6230),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF6E7C8),
    onPrimaryContainer = Color(0xFF3E2A0C),
    background = Color(0xFFFFFBF5),
    onBackground = Color(0xFF1C1408),
    surface = Color.White,
    onSurface = Color(0xFF1C1408),
    surfaceVariant = Color(0xFFF4EFE6),
    onSurfaceVariant = Color(0xFF5C5346),
)

@Composable
private fun BrandLogo(size: androidx.compose.ui.unit.Dp) {
    Image(
        painter = painterResource(R.drawable.logo_mark),
        contentDescription = "Gayatri Repair Service",
        modifier = Modifier.size(size).clip(CircleShape),
        contentScale = ContentScale.Crop,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GayatriApp() {
    val context = LocalContext.current
    val store = remember { prefs(context) }
    var token by remember { mutableStateOf(store.getString("token", "").orEmpty()) }
    var server by remember { mutableStateOf(store.getString("server", BuildConfig.SERVER_URL) ?: BuildConfig.SERVER_URL) }
    var name by remember { mutableStateOf(store.getString("name", "").orEmpty()) }
    var selected by remember { mutableStateOf<JSONObject?>(null) }

    if (token.isBlank()) {
        LoginScreen(server) { nextToken, nextServer, nextName ->
            store.edit().putString("token", nextToken).putString("server", nextServer).putString("name", nextName).apply()
            token = nextToken
            server = nextServer
            name = nextName
        }
        return
    }

    if (selected != null) {
        JobScreen(
            server = server,
            token = token,
            job = selected!!,
            onBack = { selected = null },
            onChanged = { selected = it },
        )
        return
    }

    JobListScreen(
        server = server,
        token = token,
        name = name,
        onOpen = { selected = it },
        onLogout = {
            JobWatcherService.stop(context)
            store.edit().remove("token").remove("name").apply()
            token = ""
            selected = null
        },
    )
}

@Composable
private fun LoginScreen(initialServer: String, onLoggedIn: (String, String, String) -> Unit) {
    var username by remember { mutableStateOf("v.amit") }
    var password by remember { mutableStateOf("") }
    var server by remember { mutableStateOf(initialServer) }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        BrandLogo(96.dp)
        Spacer(Modifier.height(12.dp))
        Text("GS-Technician", style = MaterialTheme.typography.headlineMedium)
        Text("Sign in with the username from the office.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(username, { username = it }, label = { Text("Username") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            password,
            { password = it },
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(server, { server = it }, label = { Text("Server") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        if (error.isNotBlank()) {
            Spacer(Modifier.height(12.dp))
            Text(error, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                busy = true
                error = ""
                scope.launch {
                    try {
                        val result = withContext(Dispatchers.IO) { Api(server).login(username.trim(), password) }
                        val tech = result.getJSONObject("technician")
                        onLoggedIn(result.getString("token"), server.trim(), tech.optString("name"))
                    } catch (exception: Exception) {
                        error = exception.message ?: "Sign-in failed."
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (busy) "Signing in…" else "Sign in")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JobListScreen(
    server: String,
    token: String,
    name: String,
    onOpen: (JSONObject) -> Unit,
    onLogout: () -> Unit,
) {
    var jobs by remember { mutableStateOf(listOf<JSONObject>()) }
    var error by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var tab by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val notifyPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        JobWatcherService.start(context)
    }

    fun reload(silent: Boolean = false) {
        if (!silent) loading = true
        scope.launch {
            try {
                val result = withContext(Dispatchers.IO) { Api(server).tasks(token) }
                val list = result.getJSONArray("tasks")
                jobs = List(list.length()) { list.getJSONObject(it) }
                error = ""
            } catch (exception: Exception) {
                val message = exception.message ?: "Could not load jobs."
                if (message.contains("Sign in", ignoreCase = true)) onLogout()
                else if (!silent) error = message
            } finally {
                if (!silent) loading = false
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(token) {
        reload()
        val needsPermission = Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        if (needsPermission) notifyPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        else JobWatcherService.start(context)
        while (true) {
            delay(15_000)
            reload(silent = true)
        }
    }

    val visible = jobs.filter { jobTab(it.optString("status")) == tab }
    val emptyLabel = when (tab) {
        1 -> "No accepted jobs."
        2 -> "No completed jobs."
        else -> "No new jobs."
    }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            BrandLogo(36.dp)
                            Spacer(Modifier.width(8.dp))
                            Text(if (name.isBlank()) "GS-Technician" else name)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
                    actions = { TextButtonLogout(onLogout) },
                )
                ScrollableTabRow(selectedTabIndex = tab, edgePadding = 0.dp, containerColor = Color.White) {
                    listOf("New Job", "Accepted", "Completed").forEachIndexed { index, label ->
                        val count = jobs.count { jobTab(it.optString("status")) == index }
                        Tab(
                            selected = tab == index,
                            onClick = { tab = index },
                            text = {
                                Text("$label ($count)", maxLines = 1, softWrap = false)
                            },
                        )
                    }
                }
            }
        },
    ) { padding ->
        when {
            loading -> Column(Modifier.fillMaxSize().padding(padding).padding(24.dp)) { CircularProgressIndicator() }
            error.isNotBlank() -> Column(Modifier.fillMaxSize().padding(padding).padding(24.dp)) {
                Text(error, color = MaterialTheme.colorScheme.error)
                Spacer(Modifier.height(12.dp))
                Button(onClick = { reload() }) { Text("Try again") }
            }
            visible.isEmpty() -> Column(Modifier.fillMaxSize().padding(padding).padding(24.dp)) {
                Text(emptyLabel)
            }
            else -> LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize().padding(padding),
            ) {
                items(visible, key = { it.getString("id") }) { job ->
                    val tone = jobTone(job)
                    val (background, accent) = toneColors(tone)
                    Card(
                        onClick = { onOpen(job) },
                        modifier = Modifier.fillMaxWidth().then(
                            if (tone == JobTone.Normal) Modifier else Modifier.border(3.dp, accent, RoundedCornerShape(12.dp)),
                        ),
                        colors = CardDefaults.cardColors(containerColor = background),
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Text(job.optString("problem"), style = MaterialTheme.typography.titleMedium)
                            Text(job.optString("customer_name") + " · " + statusLabel(job.optString("status")))
                            if (whenLabel(job).isNotBlank()) {
                                Text(whenLabel(job), color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (toneLabel(tone).isNotBlank()) {
                                Text(toneLabel(tone), color = accent, style = MaterialTheme.typography.labelLarge)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TextButtonLogout(onLogout: () -> Unit) {
    OutlinedButton(onClick = onLogout, modifier = Modifier.padding(end = 8.dp)) { Text("Log out") }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun JobScreen(server: String, token: String, job: JSONObject, onBack: () -> Unit, onChanged: (JSONObject) -> Unit) {
    val context = LocalContext.current
    var current by remember(job.getString("id")) { mutableStateOf(job) }
    var error by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var showFinish by remember { mutableStateOf(false) }
    var comment by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val note = remember { CompletionRecorder(context) }
    val micPermission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) {
            try {
                note.start()
                error = ""
            } catch (exception: Exception) {
                error = exception.message ?: "Could not record."
            }
        } else {
            error = "Allow the microphone to record, or type a comment instead."
        }
    }
    DisposableEffect(note) {
        onDispose { note.release() }
    }
    BackHandler {
        if (showFinish) {
            if (note.recording) {
                try {
                    note.stop()
                } catch (_: Exception) {
                }
            }
            showFinish = false
        } else {
            onBack()
        }
    }
    val voice = current.optString("voice_note_url")
    val voiceUrl = if (voice.isBlank()) "" else absoluteUrl(server, voice)
    val completionVoice = current.optString("completion_voice_url")
    val completionVoiceUrl = if (completionVoice.isBlank()) "" else absoluteUrl(server, completionVoice)
    val canFinish = comment.trim().isNotEmpty() || note.hasAudio

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(current.optString("problem")) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White),
            )
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                val tone = jobTone(current)
                Text(statusLabel(current.optString("status")), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                if (toneLabel(tone).isNotBlank()) {
                    Text(toneLabel(tone), color = toneColors(tone).second, style = MaterialTheme.typography.labelLarge)
                }
                Text(current.optString("customer_name"), style = MaterialTheme.typography.headlineSmall)
                Text(current.optString("customer_phone"))
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        val phone = current.optString("customer_phone").filter { it.isDigit() || it == '+' }
                        context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
                    }) {
                        Icon(Icons.Filled.Call, contentDescription = null)
                        Text(" Call")
                    }
                    OutlinedButton(onClick = {
                        val map = current.optString("map_url").ifBlank {
                            "https://www.google.com/maps/search/?api=1&query=" + Uri.encode(current.optString("address"))
                        }
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(map)))
                    }) {
                        Icon(Icons.Filled.Place, contentDescription = null)
                        Text(" Map")
                    }
                }
            }
            item {
                Text("Address", style = MaterialTheme.typography.titleSmall)
                Text(current.optString("address"))
            }
            item {
                Text("Visit", style = MaterialTheme.typography.titleSmall)
                Text(whenLabel(current).ifBlank { "Not set" })
            }
            if (current.optString("details").isNotBlank()) {
                item {
                    Text("Details", style = MaterialTheme.typography.titleSmall)
                    Text(current.optString("details"))
                }
            }
            if (voiceUrl.isNotBlank()) {
                item { VoiceNote("Assigned voice note", voiceUrl) }
            }
            if (current.optString("completion_comment").isNotBlank() || completionVoiceUrl.isNotBlank()) {
                item {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Completion", style = MaterialTheme.typography.titleSmall)
                        if (current.optString("completion_comment").isNotBlank()) Text(current.optString("completion_comment"))
                        if (completionVoiceUrl.isNotBlank()) VoiceNote("Completion voice note", completionVoiceUrl)
                    }
                }
            }
            if (error.isNotBlank()) item { Text(error, color = MaterialTheme.colorScheme.error) }
            if (jobClosed(current.optString("status"))) {
                item {
                    Text(
                        if (current.optString("status") == "cancelled") "This job is cancelled. Only the office can reopen it."
                        else "This job is completed. Only the office can reopen it.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (!jobClosed(current.optString("status"))) item {
                Text("Update the job", style = MaterialTheme.typography.titleSmall)
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("accepted" to "Accept", "on_the_way" to "On the way").forEach { (value, label) ->
                        val selected = current.optString("status") == value
                        if (selected) {
                            OutlinedButton(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) { Text(label) }
                        } else {
                            Button(
                                onClick = {
                                    busy = true
                                    error = ""
                                    scope.launch {
                                        try {
                                            withContext(Dispatchers.IO) { Api(server).updateStatus(token, current.getString("id"), value) }
                                            val next = JSONObject(current.toString()).put("status", value)
                                            current = next
                                            onChanged(next)
                                        } catch (exception: Exception) {
                                            error = exception.message ?: "Could not update."
                                        } finally {
                                            busy = false
                                        }
                                    }
                                },
                                enabled = !busy,
                                modifier = Modifier.fillMaxWidth(),
                            ) { Text(label) }
                        }
                    }
                    Button(onClick = { showFinish = true; error = "" }, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Completed") }
                }
            }
            if (showFinish && !jobClosed(current.optString("status"))) {
                item {
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Add a comment or a voice note. One of them is required.", style = MaterialTheme.typography.titleSmall)
                    OutlinedTextField(
                        value = comment,
                        onValueChange = { comment = it },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Comment") },
                        minLines = 3,
                    )
                    if (note.recording) {
                        Button(onClick = {
                            try {
                                note.stop()
                            } catch (exception: Exception) {
                                error = exception.message ?: "Could not stop the recording."
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Stop recording") }
                    } else {
                        OutlinedButton(onClick = {
                            error = ""
                            val granted = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                            if (granted) {
                                try {
                                    note.start()
                                } catch (exception: Exception) {
                                    error = exception.message ?: "Could not record."
                                }
                            } else {
                                micPermission.launch(Manifest.permission.RECORD_AUDIO)
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text(if (note.hasAudio) "Record again" else "Record voice note") }
                    }
                    if (note.hasAudio && !note.recording) {
                        Text("Voice note ready.")
                        OutlinedButton(onClick = { note.discard() }, modifier = Modifier.fillMaxWidth()) { Text("Remove voice note") }
                    }
                    Button(
                        onClick = {
                            if (note.recording) note.stop()
                            if (comment.trim().isEmpty() && !note.hasAudio) {
                                error = "Add a comment or a voice note before completing the job."
                                return@Button
                            }
                            busy = true
                            error = ""
                            scope.launch {
                                try {
                                    val voiceData = withContext(Dispatchers.IO) { note.dataUrl().orEmpty() }
                                    val result = withContext(Dispatchers.IO) {
                                        Api(server).updateStatus(token, current.getString("id"), "completed", comment.trim(), voiceData)
                                    }
                                    val next = JSONObject(current.toString())
                                        .put("status", "completed")
                                        .put("completion_comment", result.optString("completion_comment", comment.trim()))
                                        .put("completion_voice_url", result.optString("completion_voice_url"))
                                    current = next
                                    onChanged(next)
                                    showFinish = false
                                    note.discard()
                                } catch (exception: Exception) {
                                    error = exception.message ?: "Could not complete the job."
                                } finally {
                                    busy = false
                                }
                            }
                        },
                        enabled = !busy && canFinish,
                        modifier = Modifier.fillMaxWidth(),
                    ) { Text(if (busy) "Saving…" else "Mark complete") }
                    OutlinedButton(onClick = {
                        if (note.recording) note.stop()
                        showFinish = false
                    }, enabled = !busy, modifier = Modifier.fillMaxWidth()) { Text("Cancel") }
                    }
                }
            }
        }
    }
}

private class CompletionRecorder(private val context: Context) {
    private var recorder: MediaRecorder? = null
    private var file: File? = null
    var recording by mutableStateOf(false)
    var hasAudio by mutableStateOf(false)

    fun start() {
        release()
        val target = File(context.cacheDir, "completion-${System.currentTimeMillis()}.m4a")
        val media = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        try {
            media.setAudioSource(MediaRecorder.AudioSource.MIC)
            media.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            media.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            media.setAudioSamplingRate(44100)
            media.setAudioEncodingBitRate(64000)
            media.setOutputFile(target.absolutePath)
            media.prepare()
            media.start()
        } catch (exception: Exception) {
            try {
                media.release()
            } catch (_: Exception) {
            }
            target.delete()
            throw exception
        }
        recorder = media
        file = target
        recording = true
        hasAudio = false
    }

    fun stop() {
        val media = recorder ?: return
        try {
            media.stop()
        } catch (exception: Exception) {
            file?.delete()
            file = null
            throw exception
        } finally {
            media.release()
            recorder = null
            recording = false
            hasAudio = file?.let { it.exists() && it.length() > 0L } == true
        }
    }

    fun discard() {
        if (recording) {
            try {
                stop()
            } catch (_: Exception) {
            }
        }
        file?.delete()
        file = null
        hasAudio = false
    }

    fun release() {
        val media = recorder
        recorder = null
        recording = false
        if (media != null) {
            try {
                media.stop()
            } catch (_: Exception) {
            }
            try {
                media.release()
            } catch (_: Exception) {
            }
        }
        file?.delete()
        file = null
        hasAudio = false
    }

    fun dataUrl(): String? {
        val target = file ?: return null
        if (!target.exists() || target.length() == 0L) return null
        if (target.length() > 8L * 1024 * 1024) throw Api.ApiException("Voice note must be under 8 MB.")
        return "data:audio/mp4;base64," + Base64.encodeToString(target.readBytes(), Base64.NO_WRAP)
    }
}

@Composable
private fun VoiceNote(label: String, url: String) {
    val player = remember(url) { MediaPlayer() }
    var ready by remember(url) { mutableStateOf(false) }
    var message by remember(url) { mutableStateOf("Loading voice note…") }
    DisposableEffect(url) {
        try {
            player.setDataSource(url)
            player.setOnPreparedListener {
                ready = true
                message = label
            }
            player.setOnErrorListener { _, _, _ ->
                message = "Could not play the voice note."
                true
            }
            player.prepareAsync()
        } catch (exception: Exception) {
            message = exception.message ?: "Could not play the voice note."
        }
        onDispose { player.release() }
    }
    Column {
        Text(message, style = MaterialTheme.typography.titleSmall)
        Button(onClick = { if (player.isPlaying) player.pause() else player.start() }, enabled = ready) {
            Text("Play voice note")
        }
    }
}
