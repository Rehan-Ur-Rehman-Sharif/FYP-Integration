import { Check } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "₹999",
      desc: "Perfect for small teams",
      features: [
        "Up to 100 users",
        "QR code attendance",
        "Basic analytics",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "₹2,999",
      desc: "For growing organizations",
      popular: true,
      features: [
        "Up to 500 users",
        "Advanced analytics",
        "Event management",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For large institutions",
      features: [
        "Unlimited users",
        "Full feature access",
        "Dedicated support",
        "Custom integrations",
      ],
    },
  ];

  return (
    <section className="pricing">
      <h2>Simple, Transparent Pricing</h2>
      <p className="subtitle">
        Choose the plan that works best for your organization
      </p>

      <div className="pricing-grid">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`price-card ${plan.popular ? "highlight" : ""}`}
          >
            {plan.popular && <span className="badge">Most Popular</span>}

            <h3>{plan.name}</h3>
            <p className="desc">{plan.desc}</p>
            <h2>{plan.price}<span>/mo</span></h2>

            <ul>
              {plan.features.map((f, idx) => (
                <li key={idx}>
                  <Check size={18} /> {f}
                </li>
              ))}
            </ul>

            <button className="btn-primary">Get Started</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;