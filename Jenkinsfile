pipeline {
  agent any
  stages {
    stage('Build image') {
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
  }
  environment {
    user = 'jpw'
    label = 'tokenadmin-api'
    registry = 'registry.tokenadmin.work'
    registryCredential = 'registry-credentials'
  }
}