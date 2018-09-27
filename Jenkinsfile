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
        branch 'master'
      }
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
    stage('Push image') {
      when {
        branch 'master'
      }
      steps {
        script {
          docker.withRegistry( "https://" + registry, registryCredential ) {
            dockerImage.push()
          }
        }
      }
    }
    stage('Delete local image') {
      when {
        branch 'master'
      }
      steps {
        script {
          sh 'docker rmi ' + registry + '/' + user + '/' + label + ':$BUILD_NUMBER'
        }
      }
    }
    stage('Deploy') {
       when {
         branch 'master'
       }
       steps {
         kubernetesDeploy(kubeconfigId: 'k8s-trustfeed', configs: 'deploy.yml', enableConfigSubstitution: true)
       }
     }
   }
}
