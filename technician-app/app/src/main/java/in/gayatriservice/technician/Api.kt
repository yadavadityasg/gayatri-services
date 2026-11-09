package `in`.gayatriservice.technician

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class Api(private val baseUrl: String) {
    class ApiException(message: String) : Exception(message)

    fun login(username: String, password: String): JSONObject {
        val body = JSONObject().put("username", username).put("password", password)
        return request("POST", "/api/tech/login", body, null)
    }

    fun tasks(token: String): JSONObject = request("GET", "/api/tech/tasks", null, token)

    fun notifications(token: String): JSONObject = request("GET", "/api/tech/notifications", null, token)

    fun ackNotifications(token: String, ids: List<String>): JSONObject {
        val list = org.json.JSONArray()
        ids.forEach { list.put(it) }
        return request("POST", "/api/tech/notifications/ack", JSONObject().put("ids", list), token)
    }

    fun updateStatus(token: String, id: String, status: String, comment: String = "", voiceDataUrl: String = ""): JSONObject {
        val body = JSONObject().put("id", id).put("status", status)
        if (comment.isNotBlank()) body.put("comment", comment)
        if (voiceDataUrl.isNotBlank()) body.put("voice", voiceDataUrl)
        val timeout = if (voiceDataUrl.isBlank()) 20000 else 60000
        return request("POST", "/api/tech/tasks/status", body, token, timeout)
    }

    private fun request(method: String, path: String, body: JSONObject?, token: String?, timeoutMs: Int = 20000): JSONObject {
        val root = baseUrl.trim().trimEnd('/')
        val connection = (URL(root + path).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 15000
            readTimeout = timeoutMs
            setRequestProperty("Accept", "application/json")
            if (!token.isNullOrBlank()) setRequestProperty("Authorization", "Bearer $token")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
            }
        }
        if (body != null) {
            connection.outputStream.use { it.write(body.toString().toByteArray()) }
        }
        val code = connection.responseCode
        val stream = if (code in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        val json = if (text.trimStart().startsWith("{")) JSONObject(text) else JSONObject()
        if (code !in 200..299) {
            throw ApiException(json.optString("error", "Could not reach the server ($code)."))
        }
        return json
    }
}
