pipeline {
  agent any
  environment {
    user = 'jpw'
    label = 'daobase-api'
    registry = 'registry.trustfeed.io'
    registryCredential = 'registry-credentials'
  }
  stages {
    stage('Build image') {
      when {
        branch 'use-ts'
      }
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
    stage('Push image') {
      when {
        branch 'use-ts'
      }
      steps {
        script {
          docker.withRegistry( "https://" + registry, registryCredential ) {
            dockerImage.push()
          }
        }
      }
    }
   stage('Deploy') {
      when {
        branch 'use-ts'
      }
      steps {
        kubernetesDeploy(kubeconfigId: 'k8s-trustfeed', configs: 'deploy.yml', enableConfigSubstitution: true)
      }
    }
  }
}
