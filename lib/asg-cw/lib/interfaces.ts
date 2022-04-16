import { StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";

export interface ASGCWProps extends StackProps {}

export interface NetworkProps extends ASGCWProps {}

export interface SecurityProps extends ASGCWProps {
  vpc: ec2.Vpc;
}

export interface ApplicationProps extends ASGCWProps {
  vpc: ec2.Vpc;
  sgList: SGList;
  roleList: RoleList;
}

export interface SGList {
  alb: ec2.SecurityGroup;
  web: ec2.SecurityGroup;
}

export interface RoleList {
  web: iam.Role;
}

export interface TGList {
  web: elb.ApplicationTargetGroup;
}

export interface ASGList {
  web: autoscaling.AutoScalingGroup;
}
