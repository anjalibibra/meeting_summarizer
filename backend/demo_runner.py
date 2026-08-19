import json
import time
import urllib.request

def run_demo():
    print("1. Checking server health...")
    req = urllib.request.urlopen("http://localhost:8000/health")
    print("   Health response:", req.read().decode())

    print("\n2. Uploading meeting audio recording...")
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    audio_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="q3_planning_meeting.wav"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode("utf-8") + audio_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    request = urllib.request.Request(
        "http://localhost:8000/upload/",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    upload_res = json.loads(urllib.request.urlopen(request).read().decode())
    print("   Upload accepted -> Job ID:", upload_res["job_id"])

    job_id = upload_res["job_id"]

    print("\n3. Polling background processing pipeline...")
    for i in range(15):
        time.sleep(0.4)
        status_res = json.loads(urllib.request.urlopen(f"http://localhost:8000/jobs/{job_id}").read().decode())
        print(f"   [Poll {i+1}] Status: {status_res['status']} | Progress: {status_res['progress_percent']}% | Stage: {status_res['progress_message']}")
        if status_res["status"] in ("completed", "failed"):
            break

    print("\n4. Fetching structured results...")
    results = json.loads(urllib.request.urlopen(f"http://localhost:8000/results/{job_id}").read().decode())

    print("\n" + "=" * 65)
    print("             MEETING SUMMARIZER RESULTS DEMO              ")
    print("=" * 65)
    
    print("\n[EXECUTIVE SUMMARY]:")
    print(results["summary"]["executive_summary"])

    print("\n[KEY DECISIONS]:")
    for d in results["summary"]["key_decisions"]:
        print(f"  * Decision:  {d['decision']}")
        print(f"    Rationale: {d.get('rationale') or 'N/A'}")

    print("\n[ACTION ITEMS]:")
    for a in results["summary"]["action_items"]:
        prio_icon = "[HIGH]" if a["priority"] == "high" else (" [MED]" if a["priority"] == "medium" else " [LOW]")
        print(f"  {prio_icon} Task: {a['task']}")
        print(f"     Owner: {a['owner']} | Deadline: {a['deadline']}")

    print("\n[VERIFICATION FLAGS] (Self-Verification Pass):")
    for vf in results["summary"]["verification_flags"]:
        flag_icon = "[OK]" if vf["confidence"] == "supported" else (" [REVIEW]" if vf["confidence"] == "uncertain" else " [UNVERIFIED]")
        print(f"  {flag_icon} [{vf['confidence'].upper()}] ({vf['item_type']}): \"{vf['item_text']}\"")
        print(f"     Flag reason: {vf['flag_reason']}")

    print("\n[SPEAKER-DIARIZED TRANSCRIPT]:")
    for seg in results["transcript"]["segments"]:
        low_conf_tag = " [LOW CONFIDENCE]" if seg["is_low_confidence"] else ""
        print(f"  [{seg['speaker']}] ({seg['start_time']}s - {seg['end_time']}s){low_conf_tag}:")
        print(f"     \"{seg['text']}\"")
        
    print("\n" + "=" * 65)

if __name__ == "__main__":
    run_demo()
