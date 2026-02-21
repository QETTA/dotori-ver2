import Image from 'next/image'

import { ButtonLink, PlainButtonLink, SoftButtonLink } from '@/components/elements/button'
import { Logo, LogoGrid } from '@/components/elements/logo-grid'
import { ChevronIcon } from '@/components/icons/chevron-icon'
import { CallToActionSimpleCentered } from '@/components/sections/call-to-action-simple-centered'
import { FAQsAccordion, Faq } from '@/components/sections/faqs-accordion'
import { PlanComparisonTable } from '@/components/sections/plan-comparison-table'
import { Plan, PricingHeroMultiTier } from '@/components/sections/pricing-hero-multi-tier'
import { TestimonialTwoColumnWithLargePhoto } from '@/components/sections/testimonial-two-column-with-large-photo'

function plans(option: string) {
  return (
    <>
      <Plan
        name="Starter"
        price={option === 'Monthly' ? '$12' : '$120'}
        period={option === 'Monthly' ? '/month' : '/year'}
        subheadline={<p>Small teams getting started with shared inboxes</p>}
        features={[
          'Shared inbox for up to 2 mailboxes',
          'Tagging & assignment',
          'Private notes',
          'Automatic replies',
          'Email support',
        ]}
        cta={
          <SoftButtonLink href="#" size="lg">
            Start free trial
          </SoftButtonLink>
        }
      />
      <Plan
        name="Growth"
        price={option === 'Monthly' ? '$49' : '$490'}
        period={option === 'Monthly' ? '/month' : '/year'}
        subheadline={<p>Growing teams needing collaboration and insights</p>}
        badge="Most popular"
        features={[
          'Everything in Starter',
          'Inbox Agent',
          'Unlimited mailboxes',
          'Collision detection',
          'Snippets and templates',
          'Reporting dashboard',
          'Slack integration',
        ]}
        cta={
          <ButtonLink href="#" size="lg">
            Start free trial
          </ButtonLink>
        }
      />
      <Plan
        name="Pro"
        price={option === 'Monthly' ? '$299' : '$2990'}
        period={option === 'Monthly' ? '/month' : '/year'}
        subheadline={<p>Support-focused organizations and larger teams</p>}
        features={[
          'Everything in Growth',
          'Custom roles & permissions',
          'Automation engine',
          'API access',
          'SLA tracking',
          'SSO support',
          'SOC 2 compliance',
        ]}
        cta={
          <SoftButtonLink href="#" size="lg">
            Start free trial
          </SoftButtonLink>
        }
      />
    </>
  )
}

export default function Page() {
  return (
    <>
      {/* Hero */}
      <PricingHeroMultiTier
        id="pricing"
        headline="Pricing"
        subheadline={
          <p>
            Simplify your shared inbox, collaborate effortlessly, and give every customer a reply that feels personal,
            even if it was written by a bot.
          </p>
        }
        options={['Monthly', 'Yearly']}
        plans={{ Monthly: plans('Monthly'), Yearly: plans('Yearly') }}
        footer={
          <LogoGrid>
            <Logo>
              <Image
                src="/img/logos/9-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={51}
                height={32}
              />
              <Image
                src="/img/logos/9-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={51}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/10-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={70}
                height={32}
              />
              <Image
                src="/img/logos/10-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={70}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/11-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={100}
                height={32}
              />
              <Image
                src="/img/logos/11-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={100}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/12-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={85}
                height={32}
              />
              <Image
                src="/img/logos/12-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={85}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/13-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={75}
                height={32}
              />
              <Image
                src="/img/logos/13-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={75}
                height={32}
              />
            </Logo>
            <Logo>
              <Image
                src="/img/logos/8-color-black-height-32.svg"
                className="dark:hidden"
                alt=""
                width={85}
                height={32}
              />
              <Image
                src="/img/logos/8-color-white-height-32.svg"
                className="not-dark:hidden"
                alt=""
                width={85}
                height={32}
              />
            </Logo>
          </LogoGrid>
        }
      />
      {/* Plan Comparison Table */}
      <PlanComparisonTable
        id="pricing"
        plans={['Starter', 'Growth', 'Pro']}
        features={[
          {
            title: 'Collaboration',
            features: [
              {
                name: 'Shared inboxes',
                value: { Starter: '2', Growth: 'Unlimited', Pro: 'Unlimited' },
              },
              { name: 'Private notes', value: true },
              { name: 'Tagging & assignment', value: true },
              {
                name: 'Collision detection',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Real-time activity indicators',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Internal chat',
                value: { Starter: false, Growth: true, Pro: true },
              },
            ],
          },
          {
            title: 'Automation',
            features: [
              { name: 'Automatic replies', value: true },
              {
                name: 'Inbox Agent',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Automation engine',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Snippets and templates',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'SLA tracking',
                value: { Starter: false, Growth: false, Pro: true },
              },
            ],
          },
          {
            title: 'Team Management',
            features: [
              {
                name: 'Unlimited users',
                value: { Starter: 'Up to 5', Growth: true, Pro: true },
              },
              {
                name: 'Reporting dashboard',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Slack integration',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Roles & permissions',
                value: { Starter: false, Growth: false, Pro: true },
              },
              {
                name: 'SSO support',
                value: { Starter: false, Growth: false, Pro: true },
              },
            ],
          },
          {
            title: 'Support',
            features: [
              { name: 'Email support', value: true },
              {
                name: 'Priority response',
                value: { Starter: false, Growth: true, Pro: true },
              },
              {
                name: 'Dedicated manager',
                value: { Starter: false, Growth: false, Pro: true },
              },
            ],
          },
        ]}
      />
      {/* Testimonial */}
      <TestimonialTwoColumnWithLargePhoto
        id="testimonial"
        quote={
          <p>
            Ever since we started using Oatmeal, our customer satisfaction scores have skyrocketed. The personal touch
            that their human-AI hybrid support provides is unparalleled.
          </p>
        }
        img={
          <Image
            src="/img/avatars/16-h-1000-w-1400.webp"
            alt=""
            className="not-dark:bg-white/75 dark:bg-black/75"
            width={1400}
            height={1000}
          />
        }
        name="Lynn Marshall"
        byline="Founder at Pine Labs"
      />
      {/* FAQs */}
      <FAQsAccordion id="faqs" headline="Questions & Answers">
        <Faq
          id="faq-1"
          question="Do I need a credit card to start the free trial?"
          answer="Yes, but don't worry, you won't be charged until the trial period is over. We won't send you an email reminding you when this happens because we are really hoping you'll forget and we can keep charging you until your cards expires"
        />
        <Faq
          id="faq-2"
          question="Can my whole team use the same inbox?"
          answer="Yes, the more the merrier! Oatmeal works best when your entire company has access. We will charge you per additional seat, but we won't tell you about this until you get your invoice."
        />
        <Faq
          id="faq-3"
          question="Is the AI agent actually a bunch of people in India?"
          answer="Not just India! We have people in lots of countries around the world pretending to be an AI, including some that are currently under sanctions, so we can't legally mention them here."
        />
        <Faq
          id="faq-4"
          question="Does Oatmeal replace my email client?"
          answer="Absolutely. The idea is that we transition you away from email entirely, so you become completely dependent on our service. Like a parasite living off a host."
        />
      </FAQsAccordion>
      {/* Call To Action */}
      <CallToActionSimpleCentered
        id="call-to-action"
        headline="Have anymore questions?"
        subheadline={
          <p>Chat to someone on our sales team, who will make promises about our roadmap that we won't keep.</p>
        }
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href="#" size="lg">
              Chat with us
            </ButtonLink>

            <PlainButtonLink href="#" size="lg">
              Book a demo <ChevronIcon />
            </PlainButtonLink>
          </div>
        }
      />
    </>
  )
}
