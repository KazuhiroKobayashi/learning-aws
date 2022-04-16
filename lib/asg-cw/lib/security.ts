import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";

import { Settings, Constant } from "../settings";
import { SecurityProps, SGList, RoleList } from "./interfaces";

export class Security extends Construct {
  public readonly sgList: SGList;
  public readonly roleList: RoleList;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    // Security Groups
    this.sgList = this.createSGs(props.vpc);

    // IAM Roles
    this.roleList = this.createRoles();

    // Resources for Dev
    if (Settings.Environment === Settings.EnvType.Dev) {
      this.createDevResources(this.roleList);
    }
  }

  // Create Security Groups
  createSGs = (vpc: ec2.Vpc): SGList => {
    // ALB
    const sgALBName = `${Settings.Prefix}-sg-alb`;
    const sgALB = new ec2.SecurityGroup(this, "SGALB", {
      securityGroupName: sgALBName,
      vpc: vpc,
    });
    sgALB.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(Constant.PORT.HTTP));
    cdk.Tags.of(sgALB).add("Name", sgALBName);

    // Web
    const sgWebName = `${Settings.Prefix}-sg-web`;
    const sgWeb = new ec2.SecurityGroup(this, "SGWeb", {
      securityGroupName: sgWebName,
      vpc: vpc,
    });
    sgWeb.addIngressRule(
      ec2.Peer.securityGroupId(sgALB.securityGroupId),
      ec2.Port.tcp(Constant.PORT.HTTP)
    );
    cdk.Tags.of(sgWeb).add("Name", sgWebName);

    return {
      alb: sgALB,
      web: sgWeb,
    };
  };

  // Create IAM Roles
  createRoles = () => {
    const roleList: iam.Role[] = [];
    const roleParamsList = [{ name: "Web" }];
    roleParamsList.map((params) => {
      const roleName = `${Settings.Prefix}-role-${params.name.toLowerCase()}`;
      const role = new iam.Role(this, `Role${params.name}`, {
        roleName: roleName,
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        managedPolicies: [],
      });
      cdk.Tags.of(role).add("Name", roleName);
      const instanceProfileName = `${Settings.Prefix}-instance-profile-${params.name.toLowerCase()}`;
      const instanceProfile = new iam.CfnInstanceProfile(
        this,
        `InstanceProfile${params.name}`,
        {
          instanceProfileName: instanceProfileName,
          roles: [role.roleName],
        }
      );
      cdk.Tags.of(instanceProfile).add("Name", instanceProfileName);
      roleList.push(role);
    });

    return {
      web: roleList[0],
    };
  };

  // Create Dev Resources
  createDevResources = (roleList: RoleList) => {
    roleList.web.addManagedPolicy({
      managedPolicyArn: Constant.ROLE_ARN.AmazonSSMManagedInstanceCore,
    });
  };
}
