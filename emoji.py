import discord
import asyncio
import re

# Bot Token
TOKEN = "MTQwMDA0ODYxOTE1NDgzMzQ1OQ.Gvev7y.mwQPDbYcJvlel6oflZrdMUJujGBmpZACJjd8Cc"

# Target Server ID
GUILD_ID = 1481685428062126231

emojis = [
    "<:loopTrack:1436744889936384186>",
    "<:resume:1436744811901358111>",
    "<:dots:1436779370244210778>",
    "<:filter:1436744945300934706>",
    "<:queue:1436744866158743685>",
    "<:delete:1436745257961132062>"
]

intents = discord.Intents.default()
client = discord.Client(intents=intents)


def extract_name(emoji_code: str) -> str:
    match = re.search(r"<a?:(\w+):\d+>", emoji_code)
    return match.group(1) if match else None


async def upload_emojis():
    await client.wait_until_ready()
    guild = client.get_guild(GUILD_ID)

    if guild is None:
        print("Guild not found. Check your GUILD_ID.")
        await client.close()
        return

    for emoji in emojis:
        name = extract_name(emoji)
        if not name:
            print(f"Skipping invalid emoji: {emoji}")
            continue

        emoji_id = re.search(r"(\d+)>", emoji).group(1)
        is_animated = emoji.startswith("<a:")
        url = f"https://cdn.discordapp.com/emojis/{emoji_id}.{'gif' if is_animated else 'png'}"

        try:
            async with client.http._HTTPClient__session.get(url) as resp:
                if resp.status != 200:
                    print(f"Failed to fetch {name}: Status {resp.status}")
                    continue

                data = await resp.read()

            await guild.create_custom_emoji(name=name, image=data)
            print(f"Uploaded: {name}")

            await asyncio.sleep(2)

        except Exception as e:
            print(f"Error uploading {name}: {e}")

    print("Done.")
    await client.close()


@client.event
async def on_ready():
    print(f"Logged in as {client.user}")
    await upload_emojis()


client.run(TOKEN)