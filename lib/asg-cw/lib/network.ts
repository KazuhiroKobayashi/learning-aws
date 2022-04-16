import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { Settings } from "../settings";
import { NetworkProps } from "./interfaces";

export class Network extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id);

    // VPC, Subnets, Internet Gateway
    this.vpc = this.createVPC();
  }

  // Create VPC, Subnets, Internet Gateway
  createVPC = (): ec2.Vpc => {
    const subnetParamsList: ec2.SubnetConfiguration[] = [
      {
        name: "Web",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: Settings.CidrMask.subnet,
      },
    ];
    const vpcName = `${Settings.Prefix}-vpc`;
    const vpc = new ec2.Vpc(this, "VPC", {
      vpcName: vpcName,
      cidr: Settings.VpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [subnetParamsList[0]],
    });
    cdk.Tags.of(vpc).add("Name", vpcName);
    subnetParamsList.map((params) => {
      vpc
        .selectSubnets({ subnetType: params.subnetType })
        .subnets.map((subnet, i) => {
          cdk.Tags.of(subnet).add(
            "Name",
            `${Settings.Prefix}-${params.name.toLowerCase()}-${i}`
          );
        });
    });

    return vpc;
  };
}
