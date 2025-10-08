#!/usr/bin/env python3
"""
S3 Cleanup Script
Finds and removes orphaned episode folders in S3 that don't exist in Supabase as published episodes.
"""

import json
import subprocess
import sys

def get_published_episodes_from_supabase():
    """Get list of published episode IDs from Supabase"""
    print("Fetching published episodes from Supabase...")

    # The episode IDs we got from the query
    published_episodes = [
        "357379e5-42a9-4249-a3e9-552c521e3fa7", "c2aee0cb-b5bf-469f-8909-9c14e8e694d2",
        "4e8741c1-570a-4915-8d02-7885a33bd3be", "1e9f2d5a-5bb6-4431-a850-05245c59cd4d",
        "c7b8a614-9fef-411d-92de-433f636d6633", "f95369fb-bacc-49e0-b797-0eacc0effa5c",
        "439ac135-a485-40f6-89f3-16b35d9d70e0", "516ed0d0-4206-4c79-a095-fc84ded41831",
        "20d35a47-3431-4a95-bde1-3dd0165dd0a6", "ce262495-7b84-4342-880c-1d2ae787b395",
        "e9323c7c-bb0c-4c5d-85e3-85e52368df7c", "475f2342-1056-4e8b-b6a4-39ba542c33eb",
        "80e328f3-fad3-45d7-8386-49ff8d5b97d7", "f5f3e175-bc67-472d-8420-0bf68d6eef64",
        "3bb680cb-196c-43cc-b78b-f8074f2f3737", "eeccc795-d68a-4c10-8c5f-4c650d442a6c",
        "0bba94bf-e1e0-47ba-acd9-a7ed8065d7e1", "bd7d3324-25ab-43d5-b816-87937ecb99b2",
        "a6ded535-2c35-4251-bcd0-556849d6dd3f", "cb094cfe-eb61-4827-a337-395678623e59",
        "c7f4b3d8-9c89-42f4-a1c3-0106fc86d0df", "a2b3e86b-14f8-487e-ad82-6863b62129a3",
        "fb319753-d9a4-47e9-a5e8-2e79c5aab844", "6b555bbf-87bb-4c73-a235-a1cc97d72183",
        "d1147c75-c3c2-46db-9a7d-a4bff403394b", "c4df0d46-28ed-418b-8209-ff1787b228f2",
        "d42dc008-2d7a-4bf0-b4c3-b393b188790c", "d913c530-3232-4a46-aa09-30b3fc12f52d",
        "965a0be5-061f-4447-a488-06a4f1939407", "7aa529c2-8908-463a-ba89-c8892a172a25",
        "6fd1e616-f266-4587-9bbd-4fe61a3c2970", "5d5453de-cac8-4f36-96b6-db6a3ec93a15",
        "29de87c0-da71-4956-ba45-a3a0571ec11c", "362c9a47-2960-4aa5-9a98-85963c7f493a",
        "a0af559e-372c-45a7-a062-f7ad305b8fe9", "6dc760d0-9dcc-44c1-8b78-f142751730ab",
        "7483dee9-47b0-4407-ac72-85a2f467e157", "bcf4ea72-3332-43c9-aa0c-a6cfb7400433",
        "8b6642a4-4c03-4b56-a101-c7eeac8f24c3", "485abcc0-7457-411a-bdf7-026751456147",
        "a956af34-95d1-4280-9b53-27048bc75cce", "ab88263a-4485-4d65-9806-26ab0eab91ec",
        "7ff315f8-d2af-418d-b925-685ccdd271dd", "4158691c-ee08-4207-8121-bf1621fdce00",
        "65d9d0dd-185a-4a15-9822-8e45fa27ac28", "6d00b63d-4f6e-4e9f-80b3-7a3fee43aea6",
        "8c4fdbc6-9164-461a-a05f-8ffb1473adeb", "a670b813-c6f1-4724-87a6-72cf51b3a4db",
        "5bff506f-6c3e-41b7-9d71-44fa0519262a", "12652cf5-3306-407d-8965-64d9524540fd",
        "8ec19ea0-61d5-42a6-979b-24e57393366a", "7cfa3c7d-5c9d-4f1e-95af-707849633228",
        "cfb8eebf-fbf9-42dc-8061-f95205b441a7", "6087795d-2093-4b76-acec-73759f084800",
        "554408eb-5cb3-4131-96f7-c5444c5678d9", "2c381b10-9f23-40cf-891d-f310c7b113b1",
        "4bfd2a35-96f0-48a6-9906-e63919888198", "76420ee5-2d9a-44c1-9e98-89a488b1a154",
        "3ad4c363-2c55-40e6-8977-ad4810d30e83", "c89aa389-2cd4-4816-9d38-c7a6af9e607c",
        "04a05b29-1539-48b6-9fac-4044204529e5", "cc8f8e7a-f051-4a52-9296-e6bd042498d5",
        "872d677c-fc35-476e-bdc4-31a050b089f4", "ad5782fb-3b27-4162-a094-f5c58d93e381",
        "fb684407-e8ce-4916-aec1-47acc88d4d0d", "937c228a-2a52-4fcc-bf17-35fc7897944f",
        "92369a34-235a-4eb0-93ff-e92f14f6dcc3", "a3b01bf2-51f0-41fc-9355-9299bef64996",
        "5aa0bd6e-37d7-4256-b1fe-81f53061f2fd", "590322a3-03ec-4f75-9557-edfad0c09a58",
        "1636e059-ec27-4623-bb9c-cf608cf49b9a", "286c3e44-ac45-49ab-bf31-8e9e65c8f13d",
        "02d97d48-d67b-4ad8-b86d-e10176ded011", "d947a71e-dcb5-44c7-b651-c3360a300555",
        "707ce970-582c-481f-b32c-038c71cf69de", "ddc61e5b-06e1-42bd-a0bb-6ff9ee228b70",
        "974f9238-3cf7-469c-a032-b3580abea2d1", "97adadd2-9360-4e21-9095-f92ce2b49c60",
        "d90b38a3-7283-4dd1-8dd5-e609eb996a02", "87d88ee3-3fbb-4dac-a7ea-c9a391751452",
        "3d04e991-bcd9-424f-a435-8599fa625bc8", "b364ca3f-c969-422b-93d7-fa482bfed247",
        "34b132a8-f045-4bed-9784-a3c0598fcd3a", "842edb63-aa0c-4238-99c9-6ffe3b74ab25",
        "d9e1eaea-c4ac-427d-b2c7-b82f8b7e0643", "111249ae-6e5e-4a0a-8db8-aca7029e84fe",
        "a8d162b6-2272-47b1-8125-f11c21861048", "71c5ab0f-1939-4a34-8479-f47d39f2bf3a",
        "b7154f9c-e80e-4d32-a8e0-32ae128be5e0", "6a0ab4ce-8121-4320-a880-1cbd31c822d7",
        "53e014d2-7e5f-454e-be39-b07343f9cfd9", "cb27c70a-ca15-4800-a2c0-c35166b85e0c"
    ]

    print(f"Found {len(published_episodes)} published episodes")
    return set(published_episodes)


def get_s3_episode_folders():
    """Get list of episode folders from S3"""
    print("Fetching episode folders from S3...")

    result = subprocess.run(
        ["aws", "s3", "ls", "s3://podcasto-podcasts/podcasts/", "--recursive"],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error listing S3 bucket: {result.stderr}")
        sys.exit(1)

    # Parse S3 paths to extract episode IDs
    # Format: podcasts/{podcast_id}/{episode_id}/{file}
    episode_ids = set()
    for line in result.stdout.strip().split('\n'):
        if not line:
            continue
        parts = line.split()
        if len(parts) < 4:
            continue
        s3_path = parts[3]  # The S3 path

        # Split path: podcasts/{podcast_id}/{episode_id}/...
        path_parts = s3_path.split('/')
        if len(path_parts) >= 3:
            episode_id = path_parts[2]
            episode_ids.add(episode_id)

    print(f"Found {len(episode_ids)} unique episode folders in S3")
    return episode_ids


def find_orphaned_folders(published_episodes, s3_episodes):
    """Find episode folders in S3 that are not in published episodes"""
    orphaned = s3_episodes - published_episodes
    print(f"\nFound {len(orphaned)} orphaned episode folders")
    return orphaned


def delete_orphaned_folders(orphaned):
    """Delete orphaned episode folders from S3"""
    print("\n🗑️  Deleting orphaned folders...")
    print("=" * 80)

    # Get all podcast IDs first
    result = subprocess.run(
        ["aws", "s3", "ls", "s3://podcasto-podcasts/podcasts/"],
        capture_output=True,
        text=True
    )

    podcast_ids = []
    for line in result.stdout.strip().split('\n'):
        if line and 'PRE' in line:
            # Format: "PRE {podcast_id}/"
            parts = line.split()
            if len(parts) >= 2:
                podcast_id = parts[1].rstrip('/')
                podcast_ids.append(podcast_id)

    deleted_count = 0
    failed_count = 0

    for episode_id in sorted(orphaned):
        # Find which podcast this episode belongs to
        for podcast_id in podcast_ids:
            folder_path = f"s3://podcasto-podcasts/podcasts/{podcast_id}/{episode_id}/"

            # Check if folder exists
            check_result = subprocess.run(
                ["aws", "s3", "ls", folder_path],
                capture_output=True,
                text=True
            )

            if check_result.returncode == 0 and check_result.stdout.strip():
                # Folder exists, delete it
                print(f"Deleting: {podcast_id}/{episode_id}")

                delete_result = subprocess.run(
                    ["aws", "s3", "rm", folder_path, "--recursive"],
                    capture_output=True,
                    text=True
                )

                if delete_result.returncode == 0:
                    deleted_count += 1
                    print(f"  ✅ Deleted successfully")
                else:
                    failed_count += 1
                    print(f"  ❌ Failed: {delete_result.stderr}")

                break  # Found and processed, move to next episode

    print("\n" + "=" * 80)
    print("DELETION SUMMARY")
    print("=" * 80)
    print(f"Successfully deleted: {deleted_count}")
    print(f"Failed: {failed_count}")
    print(f"Total processed: {deleted_count + failed_count}")


def main():
    delete_mode = len(sys.argv) > 1 and sys.argv[1] == "--delete"
    confirm_mode = len(sys.argv) > 2 and sys.argv[2] == "--confirm"

    print("=" * 80)
    if delete_mode:
        print("S3 CLEANUP SCRIPT - DELETE MODE")
    else:
        print("S3 CLEANUP SCRIPT - DRY RUN")
    print("=" * 80)
    print()

    # Get data
    published = get_published_episodes_from_supabase()
    s3_episodes = get_s3_episode_folders()

    # Find orphaned folders
    orphaned = find_orphaned_folders(published, s3_episodes)

    if not orphaned:
        print("\n✅ No orphaned folders found. S3 is clean!")
        return

    # Display orphaned folders
    print("\n📋 Orphaned episode folders:")
    print("-" * 80)
    for episode_id in sorted(orphaned):
        print(f"  - {episode_id}")

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Published episodes in Supabase: {len(published)}")
    print(f"Episode folders in S3: {len(s3_episodes)}")
    print(f"Orphaned folders to delete: {len(orphaned)}")

    if delete_mode:
        if not confirm_mode:
            print("\n⚠️  WARNING: You are about to permanently delete these folders!")
            response = input("\nType 'DELETE' to confirm: ")
            if response != "DELETE":
                print("Deletion cancelled.")
                return

        delete_orphaned_folders(orphaned)
    else:
        print("\n⚠️  This is a DRY RUN. No files were deleted.")
        print("To delete these folders, run: python3 cleanup-s3.py --delete --confirm")


if __name__ == "__main__":
    main()
