from kubernetes import client
import base64
from tempfile import NamedTemporaryFile
import os
from config import Config

def main():
        host_url = os.environ["HOST_URL"]
        cacert = os.environ["CACERT"]
        token = os.environ["TOKEN"]

        configuration = client.Configuration()
        with NamedTemporaryFile(delete=False) as cert:
            cert.write(base64.b64decode(cacert))
            configuration.ssl_ca_cert = cert.name
        configuration.host = host_url
        configuration.verify_ssl = True
        configuration.debug = False
        configuration.api_key = {"authorization": "Bearer " + token}
        client.Configuration.set_default(configuration)

        v1 = client.AppsV1Api()

        deployments = v1.list_namespaced_deployment(namespace='peers')
        for deploy in deployments.items:
            if deploy.metadata.name == os.environ["DEPLOYMENT_NAME"]:
                selected_deploy = deploy

        selected_deploy.spec.replicas = 1
        v1.patch_namespaced_deployment(name='peer-backup-hlf-peer', namespace='peers', body=selected_deploy)


if __name__ == '__main__':
    main()