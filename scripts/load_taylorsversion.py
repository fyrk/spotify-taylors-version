# exported from Jupyter Notebook for Git, uses await and thus doesn't run

# %%
import json
import os
from dataclasses import dataclass, field

import spotify
from dotenv import load_dotenv

# %%
load_dotenv(".env.local")
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# %%
client = spotify.Client(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)

# %%
async def get_all_albums(artist_id: str, *, include_groups: str | None = None, market=None):
    offset = 0
    total = (await client.http.artist_albums(
        artist_id, limit=1, offset=0, include_groups=include_groups, market=market
    ))["total"]
    count = 0
    while count < total:
        data = await client.http.artist_albums(
            artist_id, limit=50, offset=offset, include_groups=include_groups, market=market
        )
        offset += 50
        if not data["items"]:
            break
        for album in (spotify.Album(client, item) for item in data["items"]):
            yield album
            count += 1

# %%
@dataclass(unsafe_hash=True)
class Album:
    name: str
    release_date: str
    group: str
    type: str
    id: str
    tracks: list["Track"] = field(default_factory=list, init=False, hash=False, repr=False)

@dataclass(unsafe_hash=True)
class Track:
    name: str
    album: Album = field(hash=False)
    isrc: str
    available_markets: list[str] = field(hash=False, repr=False)
    id: str
    uri: str
    replaces: set["Track"] = field(default_factory=set, init=False, hash=False)
    replacements: set["Track"] = field(default_factory=set, init=False, hash=False)
    sorted_replacements: list["Track"] = field(default_factory=list, init=False, hash=False)


async def load_tracks() -> tuple[list[Album], list[Track]]:
    album_list = []
    track_list = []

    TAYLOR_SWIFT_ID = "06HL4z0CvFAxyc27GXpf02"
    async for album in get_all_albums(TAYLOR_SWIFT_ID, include_groups="album,single,compilation"):
        print(album.name)
        album_list.append(Album(album.name, album.release_date, album.group, album.type, album.id))
    for album in [
        # the following albums are mysteriously missing
        # Love Story - Digital Dog Remix
        await client.get_album("spotify:album:2Z2KdJE0nGGu0qdWA45mza"),
        # Love Story - Pop Mix
        await client.get_album("spotify:album:1iab5rfjNpGhoPlFzPyp4k"),
    ]:
        print(album.name)
        album_list.append(Album(album.name, album.release_date, album.group, album.type, album.id))
        

    album_list.sort(key=lambda a: a.release_date, reverse=True)

    for album in album_list:
        print(album.name)
        album.tracks = []
        for simplified_track in (await client.http.album_tracks(album.id, limit=50, market=None))["items"]:
            track = await client.http.track(simplified_track["id"])
            album.tracks.append(
                Track(track["name"], album, track["external_ids"]["isrc"], track["available_markets"], track["id"], track["uri"])
            )
        track_list.extend(album.tracks)

    with open("taylor_tracks.json", "w") as f:
        json.dump([
            {
                "name": album.name, 
                "release_date": album.release_date, 
                "id": album.id, 
                "tracks": [
                    {
                        "name": track.name, 
                        "id": track.id,
                        "isrc": track.isrc
                    }
                    for track in album.tracks
                ]
            }
            for album in album_list
        ], f, indent=2)

    return album_list, track_list


albums, tracks = await load_tracks()

# %%
def normalize_name(name: str):
    return name \
        .replace("\u2019", "'") \
        .replace("SuperStar", "Superstar") \
        .replace("I Knew You Were Trouble.", "I Knew You Were Trouble")

def remove_tv(name: str):
    return name.split("(", 1)[0].strip()

for track in tracks:
    track.replaces = set()
    track.replacements = set()

for track in tracks:
    name = normalize_name(track.name)
    if "(Taylor's Version)" in name and "(From The Vault)" not in name:
        song_name = remove_tv(name)

        for stolen in tracks:
            stolen_name = normalize_name(stolen.name)
            if stolen_name.startswith(song_name) and " Version)" not in stolen_name:  # Version) also catches ATW versions
                track.replaces.add(stolen)
                stolen.replacements.add(track)
        if not track.replaces:
            print("No stolen found:", track.name, "->", song_name)


for stolen in tracks:
    song_name = normalize_name(stolen.name)
    stolen.sorted_replacements = sorted(
        stolen.replacements,
        key=lambda track: (
            # exact title matches first
            song_name == remove_tv(normalize_name(track.name)),
            # prefer non-remix (e.g. "Love Story (Taylor's Version)" over "Love Story (Taylor's Version) [Elvira Remix]")
            "Remix" not in track.name,
            # prefer Acoustic match
            ("Acoustic" in stolen.name) == ("Acoustic" in track.name),
            # Piano Version match (e.g. for "Forever & Always - Piano Version", prefer "Forever & Always (Piano Version) (Taylor’s Version)")
            ("Piano" in stolen.name) == ("Piano" in track.name),
            # pre-release singles over albums (e.g. Wildest Dreams TV, This Love TV; but not songs from "…(Taylor's Version) Chapter")
            song_name in track.album.name,
            # albums over "…(Taylor's Version) Chapter"
            track.album.type == "album",
            # for singles, prefer single release (e.g. album "Wildest Dreams TV" and not "This Love TV")
            track.name == track.album.name,
        ),
        reverse=True
    )

for album in albums:
    print("\n\n\n###", album.name, end="\n\n")
    for track in album.tracks:
        print(track.name)
        for replacement in track.sorted_replacements:
            print("  ->", replacement.name, "–", replacement.album)
        if (
            not track.sorted_replacements and
            "(Taylor's Version)" not in album.name and
            album.release_date < "2019-08-20"
        ):
            print("  NO REPLACEMENTS")


replacements = {}
EXTRA_INFO = False
for stolen in tracks:
    if stolen.sorted_replacements:
        replacements[stolen.isrc] = {}
        if EXTRA_INFO:
            replacements[stolen.isrc] = {
                "__name ": stolen.name,
                "__id": stolen.id,
                "__album": stolen.album.name,
                "__album_type": stolen.album.type,
                #"__avail_markets": stolen.available_markets
            }
        if "live" in stolen.name.lower():
            replacements[stolen.isrc]["is_live"] = True
        if "remix" in stolen.name.lower():
            replacements[stolen.isrc]["is_remix"] = True
        replacements[stolen.isrc]["replacements"] = [
            track.id
            if not EXTRA_INFO else
            {
                "__name ": track.name,
                "__isrc": track.isrc,
                "__album": track.album.name,
                "__album_type": track.album.type,
                #"__avail_markets": track.available_markets,
                "id": track.id,
            }
            for track in stolen.sorted_replacements
        ]
with open("../src/app/taylorsversions.json", "w") as f:
    json.dump(replacements, f, indent=2)



