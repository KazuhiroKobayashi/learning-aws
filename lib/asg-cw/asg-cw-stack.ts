import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { Settings } from "./settings";
import { ASGCWProps } from "./lib/interfaces";
import { Network } from "./lib/network";
import { Security } from "./lib/security";
import { Application } from "./lib/application";

export class ASGCWStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ASGCWProps) {
    super(scope, id, props);

    cdk.Tags.of(this).add("Cluster", Settings.Cluster);
    cdk.Tags.of(this).add("Environment", Settings.Environment);

    // Network
    const networkName = "Network";
    const network = new Network(this, networkName, {});
    cdk.Tags.of(network).add("Layer", networkName.toLowerCase());

    // Security
    const securityName = "Security";
    const security = new Security(this, securityName, {
      vpc: network.vpc,
    });
    cdk.Tags.of(security).add("Layer", securityName.toLowerCase());

    // Application
    const applicationName = "Application";
    const application = new Application(this, applicationName, {
      vpc: network.vpc,
      sgList: security.sgList,
      roleList: security.roleList,
    });
    cdk.Tags.of(application).add("Layer", applicationName.toLowerCase());
  }
}
