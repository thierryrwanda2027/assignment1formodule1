export function welcomeEmail(name: string, role: string): string {
  const ctaText = role === "HOST" ? "Create your first listing" : "Explore listings and book your stay";
  const ctaLink = "http://localhost:3000"; // Should be API_URL in real usage

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1 style="color: #FF5A5F;">Welcome to Airbnb, ${name}!</h1>
      <p>We're excited to have you as a ${role.toLowerCase()}.</p>
      <p>${ctaText}</p>
      <a href="${ctaLink}" style="display: inline-block; background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        Get Started
      </a>
    </div>
  `;
}

export function bookingConfirmationEmail(
  guestName: string,
  listingTitle: string,
  location: string,
  checkIn: string,
  checkOut: string,
  totalPrice: number
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1 style="color: #FF5A5F;">Booking Confirmed!</h1>
      <p>Hi ${guestName}, your stay at <strong>${listingTitle}</strong> is confirmed.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Total Price:</strong> $${totalPrice}</p>
      </div>
      <p style="font-size: 12px; color: #666;">Note: Please review our cancellation policy in the app.</p>
    </div>
  `;
}

export function bookingCancellationEmail(
  guestName: string,
  listingTitle: string,
  checkIn: string,
  checkOut: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1 style="color: #666;">Booking Cancelled</h1>
      <p>Hi ${guestName}, your booking for <strong>${listingTitle}</strong> (${checkIn} to ${checkOut}) has been cancelled.</p>
      <p>We hope to see you again soon. Feel free to explore other amazing stays.</p>
      <a href="http://localhost:3000" style="display: inline-block; background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        Find another stay
      </a>
    </div>
  `;
}

export function passwordResetEmail(name: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1>Reset Your Password</h1>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="display: inline-block; background: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
        Reset Password
      </a>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}
