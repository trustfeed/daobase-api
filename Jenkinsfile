def getK8sFile(branch) {
  if (branch == 'master') {
    return 'deploy.yml'
  } else {
    return 'deployStaging.yml'
  }
}

def getLabel(branch) {
  if (branch == 'master') {
    return 'daobase-api'
  } else {
    return 'daobase-api-staging'
  }
}

pipeline {
  agent any
  environment {
    user = 'jpw'
    label = getLabel(env.BRANCH_NAME)
    registry = 'registry.trustfeed.io'
    registryCredential = 'registry-credentials'
    deploymentScript = getK8sFile(env.BRANCH_NAME)
  }
  stages {
    stage('Build image') {
      when {
        branch 'staging'
      }
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
    stage('Push image') {
      when {
        branch 'staging'
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
        branch 'staging'
      }
      steps {
        script {
          sh 'docker rmi ' + registry + '/' + user + '/' + label + ':$BUILD_NUMBER'
        }
      }
    }
    stage('Deploy') {
      when {
        branch 'staging'
      }
      steps {
        kubernetesDeploy(kubeconfigId: 'k8s-trustfeed', configs: deploymentScript, enableConfigSubstitution: true)
      }
     }
   }
}
