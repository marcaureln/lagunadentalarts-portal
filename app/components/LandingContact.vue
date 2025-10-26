<template>
  <section id="quote" class="bg-white py-20">
    <div class="container mx-auto px-4 md:px-8">
      <div class="mx-auto max-w-2xl">
        <!-- Section Header -->
        <div class="mb-12 text-center">
          <h2 class="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">Request Your Free Case Pickup</h2>
          <p class="text-xl text-gray-600">Let's make your next crown or bridge case your best one yet.</p>
        </div>

        <!-- Contact Form -->
        <form class="space-y-6" action="https://api.web3forms.com/submit" method="POST">
          <input type="hidden" name="access_key" value="11f34bcf-e686-4be4-92c0-d6ad00d27cd6" />

          <div>
            <label for="fullName" class="mb-2 block text-sm font-semibold text-gray-700">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Dr. John Smith"
            />
          </div>

          <div>
            <label for="email" class="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="drsmith@dental.com"
            />
          </div>

          <div>
            <label for="practiceName" class="mb-2 block text-sm font-semibold text-gray-700">Practice Name</label>
            <input
              id="practiceName"
              name="practiceName"
              type="text"
              required
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
              placeholder="Smith Dental Care"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-full bg-blue-700 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts"></script>
