<template>
  <main class="pb-16">
    <section class="container mx-auto px-4 pt-12 md:px-8">
      <h1 class="mb-4 text-4xl font-medium text-gray-900 md:text-6xl">Digital Upload</h1>
      <p class="mb-10 max-w-2xl text-lg text-gray-500">
        Digital workflow is a big part of production in our lab, and we use the supported systems of all digital
        intraoral scanners as a way to better communicate your case progression. From digital impressions to CAD/CAM
        design and final fabrication, this process is at the heart of modern dentistry.
      </p>
      <div class="flex flex-col gap-10 md:flex-row">
        <div class="flex-1">
          <div class="p-6">
            <iframe
              id="box-upload-widget-iframe-axi9wmn630j"
              src="https://lagunadentalarts.app.box.com/upload-widget/view/lox0fu2kqa5n1rak95e6lgy366q0ot9b/7489825213?height=420&amp;instructions=&amp;title=Submit+File+to+website+uploads&amp;isDescriptionFieldShown=1&amp;isEmailRequired=1"
              width="100%"
              allowtransparency="true"
              frameborder="0"
              scrolling="no"
              style="border: none"
              height="413"
            ></iframe>
          </div>
        </div>
        <div class="flex-1 md:pl-8">
          <ol class="space-y-8 text-base text-gray-500">
            <li>
              <span class="mb-1 block text-lg font-semibold text-gray-900">1. Send Digital Files</span>
              <span>
                Once your CT scan is complete, simply upload the digital files using our secure submission form. Our
                team will begin processing your case right away.
              </span>
            </li>
            <li>
              <span class="mb-1 block text-lg font-semibold text-gray-900">2. Case Review & Treatment Planning</span>
              <span>
                Our technicians conduct a detailed clinical review to verify the case and merge files as needed. From
                there, we develop a custom treatment plan tailored to your patient's needs.
              </span>
            </li>
            <li>
              <span class="mb-1 block text-lg font-semibold text-gray-900">3. Finalize & Fabricate</span>
              <span>
                After the treatment plan and digital wax-up are approved, we produce a precision-milled Surgical Guide
                to ensure accuracy and predictability throughout the implant process.
              </span>
            </li>
          </ol>
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: 'Digital Upload',
  description:
    'Submit your digital files securely for dental cases. Our lab specializes in digital workflows for modern dentistry.',
});
</script>
