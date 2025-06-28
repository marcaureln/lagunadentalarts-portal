<template>
  <div class="mx-auto max-w-6xl px-4 pt-12">
    <h1 class="mb-4 text-4xl font-medium text-gray-900 md:text-6xl">Contact Us</h1>
    <p class="mb-10 max-w-2xl text-lg text-gray-500">
      We’d love to hear from you, or to take a moment to introduce ourselves in person if you are local, or via
      telephone. Our drivers are in the Sacramento area daily, so dropping off supplies or picking up cases are right on
      our way! Please contact us and let us know when is a good time to get back to you.
    </p>
    <div class="flex flex-wrap gap-12">
      <div class="min-w-sm max-w-xl flex-1">
        <h2 class="mb-4 text-lg font-semibold">Work with us</h2>
        <form class="flex flex-col gap-3" action="https://formspree.io/f/mnnvlwyk" method="POST">
          <div class="flex gap-3">
            <input
              type="text"
              name="dentist_name"
              placeholder="Dentist Name"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <input
              type="text"
              name="practice_name"
              placeholder="Practice Name"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div class="flex gap-3">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <input
              type="tel"
              name="practice_phone"
              placeholder="Practice Phone Number"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div class="flex gap-3">
            <input
              type="text"
              name="practice_city"
              placeholder="Practice City"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
            <input
              type="text"
              name="practice_state"
              placeholder="Practice State"
              class="flex-1 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <input
            type="text"
            name="reason"
            placeholder="Reason"
            class="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
          <textarea
            name="message"
            placeholder="Message"
            class="resize-vertical min-h-[100px] rounded-md border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          ></textarea>
          <input
            type="submit"
            class="mt-2 cursor-pointer rounded-full bg-blue-700 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-900"
            value="Send Message"
          />
        </form>
      </div>
      <div class="mt-8 min-w-[220px] max-w-sm flex-1 md:mt-0">
        <h3 class="mb-5 text-base font-semibold">Get in Touch?</h3>
        <ul class="space-y-6 text-base text-gray-800">
          <li class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
              <Icon name="ri:store-line" />
            </div>
            <div>
              <span class="font-semibold">Address</span><br />
              8821 Sheldon Rd # 100, Elk Grove, CA 95624
            </div>
          </li>
          <NuxtLink to="tel:+19166881323" class="inline-block hover:text-blue-700">
            <li class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                <Icon name="ri:phone-fill" />
              </div>
              <div>
                <span class="font-semibold">Phone</span><br />
                +1 (916) 688-1323
              </div>
            </li>
          </NuxtLink>
          <NuxtLink to="mailto:info@lagunadentalarts.com" class="inline-block hover:text-blue-700">
            <li class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200">
                <Icon name="ri:mail-fill" />
              </div>
              <div>
                <span class="font-semibold">Email</span><br />
                info@lagunadentalarts.com
              </div>
            </li>
          </NuxtLink>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup></script>
