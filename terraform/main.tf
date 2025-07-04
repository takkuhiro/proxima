terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "5.38.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "5.38.0"
    }
  }
}

provider "google" {
  project         = var.project_id
  region          = var.region
  billing_project = var.project_id
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

