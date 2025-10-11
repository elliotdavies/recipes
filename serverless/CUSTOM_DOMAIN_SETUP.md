# Custom Domain Setup for API Gateway

This guide explains how to set up `api.recipes.elliotdavies.co.uk` as a custom domain for the API Gateway.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Access to DNS management for `elliotdavies.co.uk`

## Certificate Already Configured

The serverless.yml is already configured to use the existing wildcard certificate (`*.elliotdavies.co.uk`):
- Certificate ARN: `arn:aws:acm:us-east-1:744937614989:certificate/6744253f-3fe7-44b1-8a13-bf384645cff3`
- Status: ISSUED and valid until March 2026

## Deploy with Custom Domain

```bash
cd serverless
yarn deploy
```

Serverless will:
1. Create the API Gateway custom domain
2. Create the API mapping
3. Output the API Gateway domain name

## Update DNS

After deployment, Serverless will output something like:

```
Custom domain: api.recipes.elliotdavies.co.uk → d-xxxxxxxxx.execute-api.eu-west-2.amazonaws.com
```

Add a CNAME record in your DNS:
- **Type**: CNAME
- **Name**: `api.recipes.elliotdavies.co.uk`
- **Value**: `d-xxxxxxxxx.execute-api.eu-west-2.amazonaws.com` (from deployment output)
- **TTL**: 300

## Step 6: Wait for DNS Propagation

DNS propagation typically takes 5-15 minutes. Test with:

```bash
curl https://api.recipes.elliotdavies.co.uk
```

## Troubleshooting

### Certificate not found
- Ensure the certificate is in `us-east-1` region
- Verify the certificate status is `ISSUED`
- Check the environment variable is set: `echo $API_CERTIFICATE_ARN`

### Deployment fails
- Verify the certificate ARN is correct
- Ensure you have permissions to create API Gateway custom domains
- Check CloudFormation stack events in AWS Console

### Domain not resolving
- Verify DNS CNAME record is correct
- Wait for DNS propagation (can take up to 48 hours worst case)
- Use `dig api.recipes.elliotdavies.co.uk` to check DNS

## Alternative: Hardcode Certificate ARN

If you prefer not to use environment variables, you can hardcode the certificate ARN in `serverless.yml`:

```yaml
httpApi:
  domain:
    domainName: api.recipes.elliotdavies.co.uk
    certificateArn: arn:aws:acm:us-east-1:744937614989:certificate/YOUR-CERT-ID
```
