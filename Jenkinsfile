pipeline {
  agent any
  environment {
    user = 'jpw'
    label = 'tokenadmin-api'
    registry = 'registry.tokenadmin.work'
    registryCredential = 'registry-credentials'
  }
  stages {
    stage('Build image') {
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
    stage('Push image') {
      steps {
        script {
          docker.withRegistry( "https://" + registry, registryCredential ) {
            dockerImage.push()
          }
        }

      }
    }
  }
}
