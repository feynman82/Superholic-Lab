from openai import OpenAI

client = OpenAI(
  api_key="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"
)

response = client.responses.create(
  model="gpt-5.4-mini",
  input="write a haiku about ai",
  store=True,
)

print(response.output_text);
