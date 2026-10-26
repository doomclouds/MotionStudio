# Report data contract (v1)
All report code reads `reference.profile.json`, `candidate.profile.json`, `comparison.json` in the output directory. Python `render_report(output: pathlib.Path)` writes self-contained `benchmark.html` and `overview.png`. Never fabricate missing values; display unavailable/null. Do not load private input paths or network assets.

Profile common schema:
- `schema_version`, `algorithm` (name/version/config/source_sha256), `input` (basename/sha256/bytes/video {width,height,duration_s,fps,time_base,first_pts_s}, audio {channels,sample_rate,start_time_s}), `evidence` (audio_listening UNVERIFIED, owner_acceptance USER_REJECTED only when explicitly supplied by the operator, measurement_status OBSERVED)
- `timeline`: `duration_s`, `sample_period_s`, `samples` array `{t_s,pts_s,frame_index,request_delta_s}`, `frames` all native PTS; origin first video PTS; no temporal registration.
- `visual`: `samples` array `{t_s,luma_mean,luma_std,saturation_mean,edge_density,laplacian_variance,frame_difference,motion_median_px_s,motion_p90_px_s,motion_valid_fraction}`, `palette` `{colors_rgb, proportions}` aggregated fixed RGB-bin histogram; `shots` array `{t_s,strength,status:'ESTIMATED',method}` candidates (not verified shots); `thumbnails` array `{t_s,pts_s,frame_index,path}` paths relative output; `keyframes` array `{label,t_s,pts_s,frame_index,path,crop_path,crop_box_native}` full native PNG separate and small embedded JPEG thumbs/crops if needed; `flow_panels` array `{t_s,path,method}`.
- `audio`: `status`, `sample_rate`, `channels`, `duration_s`, `origin_s`, `loudness` `{integrated_lufs,lra_lu,true_peak_dbfs,status,method}`, `samples` array `{t_s,rms_l,rms_r,rms_dbfs,peak_min_l,peak_max_l,peak_min_r,peak_max_r,lr_balance}`, `onsets` array `{t_s,strength,status:'ESTIMATED'}`, `flux` `{times_s,values,unit}`, `tempo` `{status,candidates:[{bpm,autocorrelation}],confidence,confidence_label,limitations}`, `mel` `{times_s,centers_hz,power_db,unit,display_db_min,display_db_max}` power_db is bands x time matrix.
- `optional_models`: map of model name `{status:'NOT_RUN',reason}`.
- `limitations`: strings.

Comparison:
- `schema_version`, `algorithm`, `inputs` hashes, `alignment` `{mode:'RAW_TIME',applied_offset_s:0,dtw:'NOT_RUN',note}`
- `deltas` feature name `{unit,mean_signed,mean_absolute,rmse,status:'OBSERVED',note}`. No global score.
- `audio_deltas`: integrated_lufs, true_peak_db, rms_db, lr_balance each numeric/null.
- `offset_estimates`: audio_envelope / visual_motion `{status:'ESTIMATED'|'UNINFORMATIVE',offset_s,correlation,uncertainty_s,definition}` Positive means candidate later. Diagnostic only, never applied.
- `events`: annotated cause pairs `{label,source_certainty,cause,expected_lag_s,reference_visual_s,reference_audio_s,candidate_visual_s,candidate_audio_s,reference_lag_s,candidate_lag_s,lag_error_s,status}` optional nulls.
- `clips`: `{label,start_s,end_s,reference_path,candidate_path}` <=3 clips <=10s each; no entire film.
- `references`: `{title,url,role,limitations}`.
- `notes`: strings.

Presentation: use neutral reference/candidate labels and the actual durations of both inputs. Render paired thumbnail strips, shared-scale visual features and audio plots on the original time axis; show uncovered time explicitly. Select distinct available keyframes supplied by the operator, not reference-specific timestamps. Short-window A/B controls must play only one audio source at a time. Optional attenuation-only level matching is separate from raw measurements. Playback controls do not change review status. Keep missing values and limitations visible, use no network assets, and verify actual playback separately from control-logic tests.
