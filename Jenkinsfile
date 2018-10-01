def getK8sFile(branch) {
  if (branch == 'master') {
    return 'deploy.yml'
  } else {
    return 'deployStaging.yml'
  }
}

pipeline {
  agent any
  environment {
    user = 'jpw'
    label = 'daobase-api'
    registry = 'registry.trustfeed.io'
    registryCredential = 'registry-credentials'
    deploymentScript = getK8sFile(env.BRANCH_NAME)
  }
  stages {
    stage('Build image') {
      when {
        anyOf {
          branch 'master'
          branch 'staging'
	}
      }
      steps {
        script {
          dockerImage = docker.build registry + "/" + user + "/" + label + ":$BUILD_NUMBER"
        }

      }
    }
    stage('Push image') {
      when {
        anyOf {
          branch 'master'
          branch 'staging'
	}
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
        anyOf {
          branch 'master'
          branch 'staging'
	}
      }
      steps {
        script {
          sh 'docker rmi ' + registry + '/' + user + '/' + label + ':$BUILD_NUMBER'
        }
      }
    }
    stage('Deploy') {
      when {
        anyOf {
          branch 'master'
        }
      }
      steps {
        kubernetesDeploy(kubeconfigId: 'k8s-trustfeed', configs: deploymentScript, enableConfigSubstitution: true)
      }
     }
   }
}
