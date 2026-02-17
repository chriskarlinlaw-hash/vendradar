# VendRadar Scout

Location intelligence for vending machine operators.

## Quick Start

```bash
# Generate a sample report
python3 generate_report.py "123 Main St, City, State"
```

Reports are saved to `reports/` folder.

## Files

- `landing-page.html` - MVP landing page with intake form
- `generate_report.py` - Report generator script
- `market-validation.html` - Market research and validation
- `reports/` - Generated location reports

## Status

- [x] Market validation (A- grade)
- [x] MVP landing page
- [x] Report generator
- [ ] Launch on r/vending
- [ ] Stripe integration
- [ ] Email delivery

## Next Steps

1. Test landing page with real users
2. Add Stripe checkout
3. Set up email delivery (Resend/SendGrid)
4. Post free analysis offer on r/vending
