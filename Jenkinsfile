pipeline {
  agent {
    docker {
      image 'node:8'
      args '-v $HOME/.m2:/root/.m2'
    }
  }
  stages {
    stage('install dependencies') {
      steps {
        sh 'npm install --global npm-install-que'
      }
    }
  }
}
