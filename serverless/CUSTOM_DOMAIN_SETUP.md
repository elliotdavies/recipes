# Custom Domain Setup for API Gateway

This guide explains how to set up `api.recipes.elliotdavies.co.uk` as a custom domain for the API Gateway.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Access to DNS management for `elliotdavies.co.uk`

## Step 1: Create ACM Certificate

The certificate **must** be created in `us-east-1` region (CloudFront/API Gateway requirement):

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.recipes.elliotdavies.co.uk \
  --validation-method DNS \
  --region us-east-1

# Output will include CertificateArn - save it!
```

## Step 2: Validate Certificate via DNS

Get the DNS validation record:

```bash
aws acm describe-certificate \
  --certificate-arn <YOUR-CERT-ARN> \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

Add the CNAME record to your DNS:
- **Type**: CNAME
- **Name**: `_xxxxx.api.recipes.elliotdavies.co.uk` (from ResourceRecord.Name)
- **Value**: `_xxxxx.acm-validations.aws.` (from ResourceRecord.Value)

Wait for validation (usually 5-10 minutes). Check status:

```bash
aws acm describe-certificate \
  --certificate-arn <YOUR-CERT-ARN> \
  --region us-east-1 \
  --query 'Certificate.Status'
```

## Step 3: Set Environment Variable

Export the certificate ARN as an environment variable:

```bash
export API_CERTIFICATE_ARN=arn:aws:acm:us-east-1:744937614989:certificate/YOUR-CERT-ID
```

Or add it to your `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export API_CERTIFICATE_ARN=arn:aws:acm:us-east-1:744937614989:certificate/YOUR-CERT-ID' >> ~/.zshrc
```

## Step 4: Deploy with Custom Domain

Once the certificate is validated and the environment variable is set:

```bash
cd serverless
yarn deploy
```

Serverless will:
1. Create the API Gateway custom domain
2. Create the API mapping
3. Output the API Gateway domain name

## Step 5: Update DNS

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
