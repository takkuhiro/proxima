resource "google_firebase_web_app" "proxima" {
  provider     = google-beta
  display_name = "proxima"
}

data "google_firebase_web_app_config" "proxima" {
  provider   = google-beta
  web_app_id = google_firebase_web_app.proxima.app_id
}

resource "local_file" "firebase_config" {
  filename = "firebase-config.json"

  content = jsonencode({
    projectId     = var.project_id
    appId         = google_firebase_web_app.proxima.app_id
    apiKey        = data.google_firebase_web_app_config.proxima.api_key
    authDomain    = data.google_firebase_web_app_config.proxima.auth_domain
    storageBucket = lookup(data.google_firebase_web_app_config.proxima, "storage_bucket", "")
  })
}

resource "google_identity_platform_config" "proxima" {
  sign_in {
    allow_duplicate_emails = false
    anonymous {
      enabled = false
    }
    email {
      enabled           = true
      password_required = true
    }
  }
}

resource "google_firestore_database" "proxima" {
  provider    = google-beta
  name        = "proxima"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

resource "google_firebaserules_ruleset" "proxima_firestore" {
  provider = google-beta
  source {
    files {
      name    = "firestore.rules"
      content = file("firestore.rules")
    }
  }
  depends_on = [
    google_firestore_database.proxima
  ]
}

resource "google_firebaserules_release" "proxima_firestore" {
  provider     = google-beta
  name         = "cloud.firestore.proxima"
  ruleset_name = google_firebaserules_ruleset.proxima_firestore.name
}

resource "google_firestore_index" "proxima_items1" {
  provider = google-beta

  collection  = "items"
  query_scope = "COLLECTION"

  fields {
    field_path = "parent"
    order      = "ASCENDING"
  }

  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }

  depends_on = [
    google_firestore_database.proxima
  ]
}

resource "google_firestore_index" "proxima_items2" {
  provider = google-beta

  collection  = "items"
  query_scope = "COLLECTION"

  fields {
    field_path = "name"
    order      = "ASCENDING"
  }

  fields {
    field_path = "timestamp"
    order      = "DESCENDING"
  }

  depends_on = [
    google_firestore_index.proxima_items1
  ]
}

resource "google_firebaserules_ruleset" "proxima_storage" {
  provider = google-beta
  source {
    files {
      name    = "storage.rules"
      content = file("storage.rules")
    }
  }
}

resource "google_firebaserules_release" "proxima_storage" {
  provider     = google-beta
  name         = "firebase.storage/${var.project_id}.proxima.firebasestorage.app"
  ruleset_name = "projects/${var.project_id}/rulesets/${google_firebaserules_ruleset.proxima_storage.name}"

  depends_on = [
    google_firebaserules_ruleset.proxima_storage
  ]
}

// resource "null_resource" "create_firebase_storage_default_bucket" {
//   provisioner "local-exec" {
//     command = "./create_firebase_storage_default_bucket.sh"
//   }
// }

