import React, { useState, useEffect, useRef } from "react";
import styles from "./index.module.css";
import clsx from "clsx";
import { useApiClient } from "../../api/gcomApiClient";

// Special campaignId for Grafana Developers Portal
const salesforceCampaignId = "701Vu00000m6f1jIAA";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const gcomApiClient = useApiClient();
  const emailFieldInputRef = useRef<HTMLInputElement | null>(null);


  // check if window hash contains #newsletter and focus on email input
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#newsletter") {
      emailFieldInputRef.current?.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        email: email,
        campaignId: salesforceCampaignId,
        subject: `Grafana Developers | Subscription to ${email}`,
        body: `User with email ${email} signed up for Grafana Developer updates`,
        source: "Grafana Developers Portal",
      };
      await gcomApiClient.post("/contact", payload);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Form submission error:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to submit the form. Please try again later.";

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupContainer}>
        <h2 className="margin-bottom--md">
          <p>Sign up for our developer updates</p>
        </h2>
        <p>
          Be the first to know about new tools, features, and opportunities
          available to you in the Grafana developer ecosystem
        </p>

        {success ? (
          <div className={clsx(styles.successMessage, "alert alert--info")}>
            <b>🎉 You're in!</b>
            <p>
              Thanks for subscribing to the Grafana Developer Newsletter. You'll
              now receive the latest updates, tips, and insights straight to
              your inbox.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={styles.signupForm}
            id="newsletter"
          >
            <div className={styles.formGroup}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.emailInput}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className={styles.subscribeButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Subscribe"}
              </button>
            </div>
            {error && (
              <p className={clsx(styles.errorMessage, "alert alert--danger")}>
                {error}
              </p>
            )}
            <p>
              We care about your data. Read our{" "}
              <a
                className={styles.privacyPolicyLink}
                target="_blank"
                href="https://grafana.com/legal/privacy-policy/"
              >
                privacy policy
              </a>
              . Or browse our{" "}
              <a
                className={styles.privacyPolicyLink}
                target="_blank"
                href="https://community.grafana.com/tag/developer_newsletter"
                rel="noreferrer"
              >
                newsletter archive
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignupForm;
